class QRGenerator {
    constructor() {
        this.qrCode = null;
        this.history = JSON.parse(localStorage.getItem('qrHistory')) || [];
        this.currentQRData = null; // Para almacenar el QR actual
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
        
        console.log('QR Generator inicializado');
        console.log('Historial cargado:', this.history.length, 'items');
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
        
        // Auto-generación con debounce
        this.textInput.addEventListener('input', this.debounce(() => {
            if (this.textInput.value.trim()) {
                this.generateQR();
            }
        }, 800));
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

        console.log('Generando QR para:', text);

        // Limpiar QR anterior
        this.qrContainer.innerHTML = '';
        
        // Crear nuevo contenedor para el QR
        const qrDiv = document.createElement('div');
        qrDiv.id = 'qrcode';
        this.qrContainer.appendChild(qrDiv);

        const size = parseInt(this.sizeSelect.value);
        const color = this.colorPicker.value;
        const bgColor = this.bgColorPicker.value;

        try {
            // Generar QR con qrcode.js
            this.qrCode = new QRCode(qrDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: color,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Esperar a que se genere completamente
            setTimeout(() => {
                this.currentQRData = {
                    text: text,
                    size: size,
                    color: color,
                    bgColor: bgColor
                };
                
                this.downloadBtn.style.display = 'inline-block';
                this.addToHistory(text);
                console.log('QR generado exitosamente');
            }, 300);

        } catch (error) {
            console.error('Error al generar QR:', error);
            alert('Error al generar el código QR');
        }
    }

    downloadQR() {
        const canvas = this.qrContainer.querySelector('canvas');
        if (!canvas) {
            alert('No hay código QR para descargar');
            return;
        }
        
        try {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `qr-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('QR descargado');
        } catch (error) {
            console.error('Error al descargar:', error);
            alert('Error al descargar el código QR');
        }
    }

    addToHistory(text) {
        const canvas = this.qrContainer.querySelector('canvas');
        if (!canvas) return;

        try {
            const qrData = {
                text: text,
                image: canvas.toDataURL('image/png'),
                timestamp: new Date().toISOString(),
                size: this.currentQRData.size,
                color: this.currentQRData.color,
                bgColor: this.currentQRData.bgColor
            };

            // Evitar duplicados
            this.history = this.history.filter(item => item.text !== text);
            
            // Agregar al principio
            this.history.unshift(qrData);
            
            // Limitar a 12 elementos
            if (this.history.length > 12) {
                this.history = this.history.slice(0, 12);
            }

            localStorage.setItem('qrHistory', JSON.stringify(this.history));
            console.log('Historial actualizado:', this.history.length, 'items');
            this.loadHistory();
            
        } catch (error) {
            console.error('Error al agregar al historial:', error);
        }
    }

    loadHistory() {
        try {
            this.historyList.innerHTML = '';
            
            if (this.history.length === 0) {
                this.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay elementos en el historial</p>';
                return;
            }

            this.history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.title = item.text; // Tooltip con texto completo
                
                const shortText = item.text.length > 25 ? 
                    item.text.substring(0, 25) + '...' : item.text;
                
                historyItem.innerHTML = `
                    <img src="${item.image}" alt="QR Code" style="width: 100%; height: auto; border-radius: 5px;">
                    <p style="font-size: 11px; margin-top: 5px; word-break: break-all; line-height: 1.2;">
                        ${this.escapeHtml(shortText)}
                    </p>
                    <small style="color: #666; font-size: 9px;">
                        ${this.formatDate(item.timestamp)}
                    </small>
                `;
                
                historyItem.addEventListener('click', () => {
                    this.textInput.value = item.text;
                    this.sizeSelect.value = item.size;
                    this.colorPicker.value = item.color;
                    this.bgColorPicker.value = item.bgColor;
                    this.generateQR();
                });
                
                this.historyList.appendChild(historyItem);
            });
            
        } catch (error) {
            console.error('Error al cargar historial:', error);
            this.historyList.innerHTML = '<p style="text-align: center; color: red;">Error al cargar historial</p>';
        }
    }

    clearHistory() {
        if (confirm('¿Estás seguro de que quieres limpiar el historial?')) {
            this.history = [];
            localStorage.removeItem('qrHistory');
            this.loadHistory();
            console.log('Historial limpiado');
        }
    }

    // Función auxiliar para escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Función auxiliar para formatear fecha
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;
        
        return date.toLocaleDateString('es-ES');
    }
}

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando QR Generator...');
    
    // Verificar que qrcode.js esté cargado
    if (typeof QRCode === 'undefined') {
        console.error('Error: QRCode library no está cargada');
        alert('Error: La librería QRCode no se ha cargado correctamente');
        return;
    }
    
    new QRGenerator();
});
