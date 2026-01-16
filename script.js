class QRGenerator {
    constructor() {
        this.qrCode = null;
        this.history = JSON.parse(localStorage.getItem('qrHistory')) || [];
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.sizeSelect = document.getElementById('size-select');
        this.colorPicker = document.getElementById('color-picker');
        this.bgColorPicker = document.getElementById('bg-color-picker');
        this.generateBtn = document.getElementById('generate-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.qrContainer = document.getElementById('qr-container');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateQR());
        this.downloadBtn.addEventListener('click', () => this.downloadQR());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Generar QR automáticamente al escribir
        this.textInput.addEventListener('input', this.debounce(() => {
            if (this.textInput.value.trim()) {
                this.generateQR();
            }
        }, 1000));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    generateQR() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            alert('Por favor ingresa algún texto o URL');
            return;
        }

        // Limpiar QR anterior
        this.qrContainer.innerHTML = '';
        
        // Mostrar loading
        this.qrContainer.innerHTML = '<div class="loading"></div>';

        const size = parseInt(this.sizeSelect.value);
        const color = this.colorPicker.value;
        const bgColor = this.bgColorPicker.value;

        // Generar nuevo QR con delay para mostrar loading
        setTimeout(() => {
            this.qrCode = new QRCode(this.qrContainer, {
                text: text,
                width: size,
                height: size,
                colorDark: color,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Esperar a que se genere el QR
            setTimeout(() => {
                this.downloadBtn.style.display = 'inline-block';
                this.addToHistory(text);
            }, 100);
        }, 500);
    }

    downloadQR() {
        if (!this.qrContainer.querySelector('canvas')) return;
        
        const canvas = this.qrContainer.querySelector('canvas');
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    addToHistory(text) {
        const canvas = this.qrContainer.querySelector('canvas');
        if (!canvas) return;

        const qrData = {
            text: text,
            image: canvas.toDataURL(),
            timestamp: new Date().toISOString()
        };

        // Limitar historial a 12 items
        this.history.unshift(qrData);
        if (this.history.length > 12) {
            this.history = this.history.slice(0, 12);
        }

        localStorage.setItem('qrHistory', JSON.stringify(this.history));
        this.loadHistory();
    }

    loadHistory() {
        this.historyList.innerHTML = '';
        
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #666;">No hay elementos en el historial</p>';
            return;
        }

        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <img src="${item.image}" alt="QR Code">
                <p style="font-size: 12px; margin-top: 5px; word-break: break-all;">
                    ${item.text.substring(0, 20)}${item.text.length > 20 ? '...' : ''}
                </p>
            `;
            
            historyItem.addEventListener('click', () => {
                this.textInput.value = item.text;
                this.generateQR();
            });
            
            this.historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        if (confirm('¿Estás seguro de que quieres limpiar el historial?')) {
            this.history = [];
            localStorage.removeItem('qrHistory');
            this.loadHistory();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new QRGenerator();
});
