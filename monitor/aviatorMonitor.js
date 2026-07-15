const flightService = require('../services/flightService');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const {
    sendTelegramMessage,
} = require('../telegram/telegramService');

const CONFIG = {
    GAME_URL: 'https://www.betsson.co/casino/crash/aviator?gameAction=play',
    USER_DATA_DIR: require('path').resolve(
        __dirname,
        '../perfil_betsson_autonomo'
    ),

    POLLING_MS: 800,
    WATCHDOG_MS: 30 * 1000,
    HEARTBEAT_MS: 60 * 1000,
    MOUSE_MS: 2 * 60 * 1000,
    APUESTA_MS: 3 * 60 * 1000,

    MAX_IFRAME_INTENTOS: 25,
    IFRAME_RETRY_MS: 5000,
    LOGIN_MAX_INTENTOS: 5,
    RESTART_DELAY_MS: 5000,
    BACKEND_QUEUE_MAX: 300,

};

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
    const hora = new Date().toLocaleTimeString('es-CO', { hour12: false });
    console.log(`[${hora}] ${msg}`);
}

async function enviarTelegram(texto) {
    const result = await sendTelegramMessage(texto);

    if (result.sent) {
        log('📨 Telegram enviado');
    }
}

class ZoraidaMonitor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.gameFrame = null;

        this.ultimoEnviado = '';
        this.ultimoVueloDetectadoAt = Date.now();
        this.alertaSinLecturaEnviada = false;

        this.intervals = [];
        this.backendQueue = [];

        this.running = false;
        this.restarting = false;
        this.stopping = false;
        this.pollingActivo = false;
        this.flushActivo = false;
    }

    async start() {
        if (this.running) return;

        this.running = true;
        this.stopping = false;

        log('🚀 Iniciando Zoraida Monitor...');

        this.browser = await this.crearNavegador();
        this.page = await this.crearPagina(this.browser);

        const juegoOk = await this.inicializarJuego();

        if (!juegoOk) {
            throw new Error('No fue posible inicializar el juego.');
        }

        this.iniciarServicios();

        log('✅ Zoraida Monitor funcionando.');
        await enviarTelegram('✅ Zoraida Monitor conectado correctamente.');
    }

    async stop() {
        this.stopping = true;
        this.running = false;

        this.detenerServicios();

        this.gameFrame = null;
        this.pollingActivo = false;
        this.flushActivo = false;

        if (this.browser) {
            try {
                await this.browser.close();
            } catch (_) {}
        }

        this.browser = null;
        this.page = null;
    }

    async restart(motivo) {
        if (this.restarting) return;

        this.restarting = true;

        log(`🔄 Reiniciando monitor. Motivo: ${motivo}`);
        await enviarTelegram(`🔄 Zoraida reiniciando monitor.\n\nMotivo: ${motivo}`);

        try {
            await this.stop();
            await esperar(CONFIG.RESTART_DELAY_MS);
        } catch (e) {
            log(`⚠️ Error durante stop(): ${e.message}`);
        }

        try {
            this.restarting = false;
            await this.start();
            log('✅ Monitor reiniciado correctamente.');
            await enviarTelegram('✅ Zoraida reinició correctamente.');
        } catch (e) {
            log(`❌ Error reiniciando monitor: ${e.message}`);
            await enviarTelegram(`❌ Error reiniciando Zoraida:\n\n${e.message}`);

            this.restarting = false;

            setTimeout(() => {
                this.restart('Reintento automático después de fallo de reinicio').catch(console.error);
            }, 15000);
        }
    }

    iniciarServicios() {
        this.detenerServicios();

        this.intervals.push(setInterval(
            () => this.moverRatonHumano().catch(() => {}),
            CONFIG.MOUSE_MS + Math.random() * 60 * 1000
        ));

        this.intervals.push(setInterval(
            () => this.cambiarMontoApuesta().catch(() => {}),
            CONFIG.APUESTA_MS + Math.random() * 60 * 1000
        ));

        this.intervals.push(setInterval(
            () => this.watchdogLectura().catch(e => log(`Watchdog error: ${e.message}`)),
            CONFIG.WATCHDOG_MS
        ));

        this.intervals.push(setInterval(
            () => this.heartbeat().catch(e => this.restart(`Heartbeat falló: ${e.message}`)),
            CONFIG.HEARTBEAT_MS
        ));

        this.intervals.push(setInterval(
            () => this.polling().catch(e => log(`Polling error: ${e.message}`)),
            CONFIG.POLLING_MS
        ));

        this.intervals.push(setInterval(
            () => this.flushBackendQueue().catch(e => log(`Queue error: ${e.message}`)),
            10 * 1000
        ));
    }

    detenerServicios() {
        for (const interval of this.intervals) {
            clearInterval(interval);
        }

        this.intervals = [];
    }

    async crearNavegador() {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            userDataDir: CONFIG.USER_DATA_DIR,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        });

        browser.on('disconnected', () => {
            if (this.stopping || this.restarting) return;

            log('❌ El navegador se desconectó.');
            this.restart('Navegador desconectado').catch(console.error);
        });

        return browser;
    }
    
    async crearPagina(browser) {
        const pages = await browser.pages();

        const page = pages.length > 0
            ? pages[0]
            : await browser.newPage();

        for (const extraPage of pages.slice(1)) {
            try {
                await extraPage.close();
            } catch (_) {}
        }

        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);

        page.on('error', (e) => {
            log(`❌ Page error: ${e.message}`);
            this.restart(`Page error: ${e.message}`).catch(console.error);
        });

        page.on('close', () => {
            if (this.stopping || this.restarting) return;

            log('❌ Page cerrada.');
            this.restart('Page cerrada').catch(console.error);
        });

        return page;
    }

    async inicializarJuego() {
        await this.page.goto(CONFIG.GAME_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        log('✅ Página cargada.');

        const exito = await this.manejarLoginYRecarga();

        if (!exito) {
            log('❌ No se pudo iniciar sesión.');
            return false;
        }

        const frame = await this.buscarIframeEnBucle();

        return Boolean(frame);
    }

    async manejarLoginYRecarga() {
        let intentos = 0;

        while (intentos < CONFIG.LOGIN_MAX_INTENTOS) {
            await esperar(3000);

            const url = this.page.url();
            const title = await this.page.title();
            const bodyText = await this.page.evaluate(() => document.body.innerText);

            log(`🔍 Estado actual: URL=${url}, Title=${title}`);

            if (url.includes('aviator') && !bodyText.includes('Actualiza la página')) {
                log('✅ Página del juego detectada.');
                return true;
            }

            if (bodyText.includes('Actualiza la página')) {
                log(`🔄 Intento ${intentos + 1}: Recarga detectada. Recargando...`);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await esperar(5000);
                intentos++;
                continue;
            }

            if (
                bodyText.includes('cloudflare') ||
                bodyText.includes('verifying') ||
                bodyText.includes('security')
            ) {
                log('🛡️ Detectado captcha/verificación. Esperando 15 segundos...');
                await esperar(15000);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await esperar(5000);
                intentos++;
                continue;
            }

            if (
                bodyText.includes('Inicia sesión') ||
                bodyText.includes('Ingresa') ||
                bodyText.includes('Email')
            ) {
                log('👀 Login detectado. Esperando 60 segundos para login manual...');
                await esperar(60000);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await esperar(5000);
                continue;
            }

            log('⚠️ Estado desconocido. Recargando...');
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await esperar(5000);
            intentos++;
        }

        log('❌ No se pudo superar el bloqueo después de 5 intentos.');
        return false;
    }

    async buscarIframeEnBucle() {
        for (let intento = 1; intento <= CONFIG.MAX_IFRAME_INTENTOS; intento++) {
            try {
                const frames = this.page.frames();
                const encontrado = frames.find(f =>
                    f.url().includes('aviator-next.spribegaming.com')
                );

                if (encontrado) {
                    log(this.gameFrame
                        ? '✅ Iframe recuperado.'
                        : '✅ Iframe encontrado. Monitoreando historial...'
                    );

                    this.gameFrame = encontrado;
                    return encontrado;
                }

                log(`🔍 Buscando iframe... Intento ${intento}/${CONFIG.MAX_IFRAME_INTENTOS}`);
                await esperar(CONFIG.IFRAME_RETRY_MS);
            } catch (e) {
                log(`Error buscando iframe: ${e.message}`);
                await esperar(CONFIG.IFRAME_RETRY_MS);
            }
        }

        log('❌ No fue posible recuperar el iframe.');
        await enviarTelegram(`❌ Zoraida no pudo recuperar el iframe después de ${CONFIG.MAX_IFRAME_INTENTOS} intentos.`);

        return null;
    }

    async recuperarIframe() {
        this.gameFrame = null;

        const frame = await this.buscarIframeEnBucle();

        return Boolean(frame);
    }

    async obtenerUltimoMultiplicador() {
        return await this.gameFrame.evaluate(() => {
            const payouts = document.querySelectorAll('.payout');

            if (payouts.length === 0) return null;

            const texto = payouts[0].innerText.trim();
            const match = texto.match(/(\d+\.\d{2})/);

            return match ? parseFloat(match[1]) : null;
        });
    }

    async polling() {
        if (this.pollingActivo) return;

        this.pollingActivo = true;

        try {
            if (!this.gameFrame) {
                const recuperado = await this.recuperarIframe();

                if (!recuperado) {
                    await this.restart('No hay iframe disponible en polling.');
                }

                return;
            }

            let multiplier = null;

            try {
                multiplier = await this.obtenerUltimoMultiplicador();
            } catch (_) {
                log('⚠️ Frame viejo o perdido. Rebuscando iframe...');

                const recuperado = await this.recuperarIframe();

                if (!recuperado) {
                    await this.restart('No fue posible recuperar iframe desde polling.');
                }

                return;
            }

            if (multiplier === null) return;

            const multiplicadorTexto = multiplier.toFixed(2);

            if (multiplicadorTexto === this.ultimoEnviado) return;

            this.ultimoEnviado = multiplicadorTexto;
            this.ultimoVueloDetectadoAt = Date.now();

            if (this.alertaSinLecturaEnviada) {
                this.alertaSinLecturaEnviada = false;
                await enviarTelegram('✅ Zoraida recuperó lectura\n\nEl iframe volvió a responder y ya se están detectando vuelos.');
            }

            await this.enviarMultiplicador(multiplier);
        } finally {
            this.pollingActivo = false;
        }
    }

    async enviarMultiplicador(multiplier) {
        const payload = {
            multiplier,
            timestamp: Date.now(),
            source: 'historial-polling'
        };

        log(`🎯 MULTIPLICADOR: ${multiplier.toFixed(2)}x`);

        const enviado = await this.enviarPayloadBackend(payload);

        if (enviado) {
            log(`💾 Vuelo registrado en el sistema: ${multiplier.toFixed(2)}x`);
            return;
        }

        this.encolarPayload(payload);
    }

    async enviarPayloadBackend(payload) {
        try {
            await flightService.registerFlight(payload);
            return true;
        } catch (e) {
            log(`Error registrando vuelo: ${e.message}`);
            return false;
        }
    }

    encolarPayload(payload) {
        this.backendQueue.push(payload);

        if (this.backendQueue.length > CONFIG.BACKEND_QUEUE_MAX) {
            this.backendQueue.shift();
        }

        log(`📦 Vuelo en cola. Pendientes: ${this.backendQueue.length}`);
    }

    async flushBackendQueue() {
        if (this.flushActivo || this.backendQueue.length === 0) return;

        this.flushActivo = true;

        try {
            while (this.backendQueue.length > 0) {
                const payload = this.backendQueue[0];
                const enviado = await this.enviarPayloadBackend(payload);

                if (!enviado) return;

                this.backendQueue.shift();
                log(`📤 Cola enviada. Pendientes: ${this.backendQueue.length}`);
            }
        } finally {
            this.flushActivo = false;
        }
    }

    async watchdogLectura() {
        const ahora = Date.now();
        const minutosSinLectura = (ahora - this.ultimoVueloDetectadoAt) / 60000;

        if (minutosSinLectura < 5 || this.alertaSinLecturaEnviada) return;

        this.alertaSinLecturaEnviada = true;

        const msg = `⚠️ Zoraida sin lectura\n\nNo se detectan vuelos nuevos desde hace 5 minutos.\nPosible sesión caída, iframe perdido o navegador congelado.\n\nRevisa Betsson / Chrome / bot.`;

        log(msg);
        await enviarTelegram(msg);

        const recuperado = await this.recuperarIframe();

        if (!recuperado) {
            await this.restart('Watchdog sin lectura y sin iframe recuperable.');
        }
    }

    async heartbeat() {
        if (!this.page || this.page.isClosed()) {
            throw new Error('Page cerrada o inexistente.');
        }

        await this.page.title();

        if (!this.gameFrame) {
            const recuperado = await this.recuperarIframe();

            if (!recuperado) {
                throw new Error('Heartbeat no pudo recuperar iframe.');
            }

            return;
        }

        try {
            await this.gameFrame.evaluate(() => document.readyState);
        } catch (e) {
            const error = String(e.message).toLowerCase();

            if (
                error.includes('target closed') ||
                error.includes('session closed') ||
                error.includes('browser has disconnected') ||
                error.includes('execution context was destroyed')
            ) {
                throw e;
            }

            const recuperado = await this.recuperarIframe();

            if (!recuperado) {
                throw new Error('Heartbeat perdió iframe y no pudo recuperarlo.');
            }
        }
    }

    async moverRatonHumano() {
        if (!this.page || this.page.isClosed()) return;

        try {
            const bounds = await this.page.evaluate(() => ({
                w: window.innerWidth,
                h: window.innerHeight
            }));

            const x = 100 + Math.random() * (bounds.w - 200);
            const y = 100 + Math.random() * (bounds.h - 200);
            const steps = 20;

            const start = await this.page.evaluate(() => ({
                x: window.mouseX || 0,
                y: window.mouseY || 0
            }));

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const stepX = start.x + (x - start.x) * t;
                const stepY = start.y + (y - start.y) * t;

                await this.page.mouse.move(stepX, stepY);
                await esperar(10 + Math.random() * 20);
            }

            await this.page.evaluate((x, y) => {
                window.mouseX = x;
                window.mouseY = y;
            }, x, y);
        } catch (_) {}
    }

    async cambiarMontoApuesta() {
        if (!this.page || this.page.isClosed()) return;

        try {
            const input = await this.page.$('input[type="number"], .bet-input, [name="bet"]');

            if (!input) return;

            const montos = [10000, 5000, 15000];
            const nuevo = montos[Math.floor(Math.random() * montos.length)];

            await input.click({ clickCount: 3 });
            await input.type(nuevo.toString(), { delay: 50 + Math.random() * 100 });

            log(`💰 Monto simulado cambiado a ${nuevo} COP`);
        } catch (_) {}
    }
}

const monitor = new ZoraidaMonitor();

async function start() {
    await monitor.start();
}

async function stop() {
    await monitor.stop();
}

module.exports = {
    start,
    stop,
};