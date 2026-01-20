// preset management system for slider values
// handles saving, loading, and managing parameter presets in localStorage

class PresetManager {
  constructor(storageKey = 'grids-presets') {
    this.storageKey = storageKey;
    this.presets = this.loadFromStorage();
    this.currentMode = 'idle'; // modes: idle, saving, loading, deleting
  }

  // load all presets from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('error loading presets from storage:', error);
      return {};
    }
  }

  // save all presets to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
      return true;
    } catch (error) {
      console.error('error saving presets to storage:', error);
      return false;
    }
  }

  // get list of preset names
  getPresetNames() {
    return Object.keys(this.presets).sort();
  }

  // check if preset exists
  presetExists(name) {
    return name in this.presets;
  }

  // save current state as a preset
  savePreset(name, state, overwrite = false) {
    if (!name || name.trim() === '') {
      throw new Error('preset name cannot be empty');
    }

    const trimmedName = name.trim();

    // prevent accidental overwrites
    if (this.presetExists(trimmedName) && !overwrite) {
      throw new Error(`preset "${trimmedName}" already exists. use overwrite flag to replace.`);
    }

    this.currentMode = 'saving';

    try {
      this.presets[trimmedName] = {
        ...state,
        timestamp: Date.now(),
        version: '1.0'
      };

      const success = this.saveToStorage();
      this.currentMode = 'idle';

      if (success) {
        return { success: true, message: `preset "${trimmedName}" saved successfully` };
      } else {
        throw new Error('failed to save to localStorage');
      }
    } catch (error) {
      this.currentMode = 'idle';
      throw error;
    }
  }

  // load a preset
  loadPreset(name) {
    if (!this.presetExists(name)) {
      throw new Error(`preset "${name}" does not exist`);
    }

    this.currentMode = 'loading';

    try {
      const preset = this.presets[name];
      this.currentMode = 'idle';
      return { success: true, state: preset, message: `preset "${name}" loaded successfully` };
    } catch (error) {
      this.currentMode = 'idle';
      throw error;
    }
  }

  // delete a preset
  deletePreset(name) {
    if (!this.presetExists(name)) {
      throw new Error(`preset "${name}" does not exist`);
    }

    this.currentMode = 'deleting';

    try {
      delete this.presets[name];
      const success = this.saveToStorage();
      this.currentMode = 'idle';

      if (success) {
        return { success: true, message: `preset "${name}" deleted successfully` };
      } else {
        throw new Error('failed to save changes to localStorage');
      }
    } catch (error) {
      this.currentMode = 'idle';
      throw error;
    }
  }

  // export all presets as JSON
  exportPresets() {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      presets: this.presets
    };
  }

  // import presets from JSON
  importPresets(data, mode = 'merge') {
    try {
      if (!data.presets || typeof data.presets !== 'object') {
        throw new Error('invalid preset data format');
      }

      if (mode === 'overwrite') {
        // completely replace existing presets
        this.presets = data.presets;
      } else {
        // merge with existing presets (imported presets take precedence)
        this.presets = { ...this.presets, ...data.presets };
      }

      const success = this.saveToStorage();

      if (success) {
        return {
          success: true,
          message: `imported ${Object.keys(data.presets).length} preset(s) successfully`,
          count: Object.keys(data.presets).length
        };
      } else {
        throw new Error('failed to save imported presets');
      }
    } catch (error) {
      throw error;
    }
  }

  // clear all presets (with safety check)
  clearAllPresets(confirmation) {
    if (confirmation !== 'DELETE_ALL') {
      throw new Error('confirmation string does not match. type "DELETE_ALL" to confirm.');
    }

    this.presets = {};
    const success = this.saveToStorage();

    if (success) {
      return { success: true, message: 'all presets cleared successfully' };
    } else {
      throw new Error('failed to clear presets');
    }
  }

  // get current mode
  getMode() {
    return this.currentMode;
  }

  // get preset count
  getPresetCount() {
    return Object.keys(this.presets).length;
  }
}

// export for use in other files
window.PresetManager = PresetManager;
// Also make it global
PresetManager = window.PresetManager;