class ColorPicker {
    constructor() {
        this.palettes = [
            ['#ffebff', '#fab9fa', '#ff0f0f', '#8c0f05', '#410028'],
            ['#f0f5fa', '#c8ebf5', '#05b4f0', '#82aac3', '#508296']
        ];
        
        this.activeInput = null;
        this.pickerElement = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded if not already
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // specific inputs to replace
        const inputs = ['fillColorPicker', 'bgColorPicker'];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                this.setupCustomPicker(input);
            }
        });

        this.createPickerElement();
        
        // Close picker when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (this.pickerElement && 
                !this.pickerElement.contains(e.target) && 
                !e.target.classList.contains('color-swatch-trigger') &&
                !this.pickerElement.classList.contains('hidden')) {
                this.hidePicker();
            }
        });
    }

    setupCustomPicker(input) {
        // Hide original input but keep it in layout for native picker triggering
        input.style.opacity = '0';
        input.style.position = 'absolute';
        input.style.pointerEvents = 'none';
        input.style.width = '1px';
        input.style.height = '1px';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.border = 'none';
        
        // Create swatch trigger
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-trigger';
        swatch.style.backgroundColor = input.value;
        
        swatch.addEventListener('click', (e) => {
            // Toggle picker if clicking the same swatch
            if (this.activeInput === input && !this.pickerElement.classList.contains('hidden')) {
                this.hidePicker();
            } else {
                this.showPicker(e.target, input);
            }
        });

        // Insert swatch after input
        input.parentNode.insertBefore(swatch, input.nextSibling);
        
        // Update swatch when input changes (programmatically or otherwise)
        input.addEventListener('input', () => {
            swatch.style.backgroundColor = input.value;
        });
        
        // Also listen for changes to the sliderValues object if possible, 
        // but since that's internal to script.js, we rely on the input value being source of truth
        // or the input being updated when sliderValues update (which happens in setSliderValues)
        
        // We need to patch the input so if setSliderValues updates it, the swatch updates
        // However, MutationObserver on value attribute might be overkill.
        // script.js updates DOM elements in initializeSliders and updateSliderValue?
        // script.js updates `document.getElementById(property + 'Value').textContent` but for colors?
        // For colors it seems it only reads FROM input in `updateColorValue`. 
        // But `setSliderValues` does: `if (element) { if (element.type === 'checkbox') ... else element.value = val; }`
        // So `element.value = val` does not fire input event.
        // We need to observe the element or hook into it.
        
        // Let's use a MutationObserver for the value attribute just in case, or define a setter.
        // But value property doesn't trigger attribute change.
        
        // Let's hook into the input's value property setter?
        // Or simply, we can patch `input` to update swatch.
        
        const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        // It's tricky to patch prototype.
        
        // Instead, let's just make sure when we load/set values we update the swatch.
        // We can add a periodic check or just hope `script.js` fires an event.
        // Actually, `script.js`'s `setSliderValues` sets `element.value = val`. 
        // We can add a listener to the `change` event but setting value via JS doesn't trigger events.
        
        // Workaround: We can poll or just expose a global update function if needed.
        // But for now, let's keep it simple. If presets are loaded, swatches might get out of sync 
        // until we handle that.
        // Ideally, `setSliderValues` in `script.js` should dispatch an event. 
        // But I can't modify `script.js` easily for that without parsing it.
        // Actually I CAN modify script.js.
    }

    createPickerElement() {
        this.pickerElement = document.createElement('div');
        this.pickerElement.id = 'custom-color-picker';
        this.pickerElement.className = 'custom-color-picker hidden';
        
        this.palettes.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'color-picker-row';
            
            row.forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.className = 'color-picker-option';
                colorDiv.style.backgroundColor = color;
                colorDiv.dataset.color = color;
                
                colorDiv.addEventListener('click', () => {
                    this.selectColor(color);
                });
                
                rowDiv.appendChild(colorDiv);
            });
            
            this.pickerElement.appendChild(rowDiv);
        });
        
        // Add "more colors..." button
        const moreDiv = document.createElement('div');
        moreDiv.className = 'color-picker-more';
        moreDiv.textContent = 'more colors...';
        moreDiv.addEventListener('click', (e) => {
             e.stopPropagation(); // prevent closing immediately
             this.openNativePicker();
        });
        this.pickerElement.appendChild(moreDiv);
        
        document.body.appendChild(this.pickerElement);
    }

    openNativePicker() {
        if (this.activeInput) {
            const input = this.activeInput;
            // Hide custom picker first
            this.hidePicker();
            
            // Trigger native picker
            try {
                if (input.showPicker) {
                    input.showPicker();
                } else {
                    input.click();
                }
            } catch (err) {
                console.error('Could not open native picker:', err);
                // Fallback attempt: just click it
                if (input) input.click();
            }
        }
    }

    showPicker(trigger, input) {
        this.activeInput = input;
        this.pickerElement.classList.remove('hidden');
        
        const rect = trigger.getBoundingClientRect();
        
        // Position relative to trigger
        // We want it to be right of the label usually, or below.
        // The menu container has absolute positioning. 
        // The picker is appended to body, so we use page coordinates.
        
        // Let's put it to the left of the trigger if there's space, or below.
        // The menu is on the right side of screen.
        // So putting it to the left of the swatch is safer.
        
        this.pickerElement.style.top = `${rect.top}px`;
        this.pickerElement.style.left = `${rect.left - this.pickerElement.offsetWidth - 10}px`;
        
        // Correction if it hasn't rendered width yet
        requestAnimationFrame(() => {
             this.pickerElement.style.left = `${rect.left - this.pickerElement.offsetWidth - 10}px`;
        });
    }

    hidePicker() {
        this.pickerElement.classList.add('hidden');
        this.activeInput = null;
    }

    selectColor(color) {
        if (this.activeInput) {
            this.activeInput.value = color;
            // Dispatch input event so script.js notices
            this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Update the swatch immediately
            const swatch = this.activeInput.nextSibling;
            if (swatch && swatch.classList.contains('color-swatch-trigger')) {
                swatch.style.backgroundColor = color;
            }
            
            this.hidePicker();
        }
    }
    
    // Helper to update swatches programmatically
    updateSwatches() {
        const inputs = ['fillColorPicker', 'bgColorPicker'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.nextSibling && input.nextSibling.classList.contains('color-swatch-trigger')) {
                input.nextSibling.style.backgroundColor = input.value;
            }
        });
    }
}

// Global instance
let colorPicker;
document.addEventListener('DOMContentLoaded', () => {
    colorPicker = new ColorPicker();
});
