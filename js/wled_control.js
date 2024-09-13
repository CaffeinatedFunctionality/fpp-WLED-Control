$(document).ready(function () {
  let wledControlConfig = {
    systems: [],
    models: [],
    brightness: 255,
    colors: [],
    multisync: false,
    effect: 'Solid',
    power: false,
    customPalettes: [],
    effectDetails: {},
    selectedPalette: '* Colors Only'
  }

  let updatingColorBasedOnPalette = false;
  let initializing = true;

  function GetWledControlConfig() {
    const url = '/api/configfile/plugin.fpp-WLED-Control.json'

    if (window.fetch) {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.json()
        })
        .then(data => {
          console.log('Config loaded successfully:', data)
          processConfig(data)
        })
        .catch(error => {
          console.error('Fetch error:', error)
        })
    }
  }

  function processConfig(data) {
    wledControlConfig = data
    if (!wledControlConfig.customPalettes) {
      wledControlConfig.customPalettes = []
    }
    if (!wledControlConfig.selectedPalette) {
      wledControlConfig.selectedPalette = '* Colors Only'
    }
    updateUIFromConfig()
    initializeColorPickers();
    updateCustomColorDisplay();
    if (wledControlConfig.effect) {
      selectEffect(wledControlConfig.effect);
      updatePaletteDropdown();
    }
    initializing = false;
  }

  function SaveWledControlConfig() {
    console.log('SaveWledControlConfig called', new Error().stack);
    // Filter out null values before saving
    wledControlConfig.colors = wledControlConfig.colors.filter(
      color => color !== null
    )

    var data = JSON.stringify(wledControlConfig)
    $.ajax({
      type: 'POST',
      url: 'api/configfile/plugin.fpp-WLED-Control.json',
      dataType: 'json',
      data: data,
      processData: false,
      contentType: 'application/json',
      success: function () {
        console.log('WLED Control config saved successfully')
        checkAndRunEffect()
      },
      error: function (xhr, status, error) {
        console.error('Error saving WLED Control config:', error)
      }
    })
  }

  function CreateEffectJSON() {
    var json = {}
    json['command'] =
      wledControlConfig.effect !== 'Solid'
        ? 'Overlay Model Effect'
        : 'Overlay Model Fill'
    json['multisyncCommand'] = wledControlConfig.multisync
    json['multisyncHosts'] = wledControlConfig.systems.join(',')
    json['args'] = []
    json['args'].push(wledControlConfig.models.join(',')) //models
    json['args'].push('Enabled') //state
    if(wledControlConfig.effect !== 'Solid'){
      json['args'].push(wledControlConfig.effect)
      for (var key in wledControlConfig.effectDetails) {
        if (key === "Palette" && wledControlConfig.customPalettes.includes(wledControlConfig.effectDetails[key])) {
          json['args'].push("* Colors Only")
        } else {
          json['args'].push(wledControlConfig.effectDetails[key].toString())
        }
      }
      wledControlConfig.colors.forEach(color => {
        json['args'].push(color)
      })
    } else {
      json['args'].push(wledControlConfig.colors[0])
    }
    
    return json
  }

  function RunWledEffect() {
    var json = CreateEffectJSON()
    $.ajax({
      type: 'POST',
      url: 'api/command',
      dataType: 'json',
      data: JSON.stringify(json),
      contentType: 'application/json',
      success: function (data) {
        console.log('WLED effect started successfully')
      }
    })
  }

  function stopWledEffects() {
    const args = wledControlConfig.effect !== 'Solid' ? [wledControlConfig.models.join(','), 'Enabled', 'Stop Effects'] : [wledControlConfig.models.join(',')];
    $.ajax({
      type: 'POST',
      url: 'api/command',
      dataType: 'json',
      data: JSON.stringify({
        command: wledControlConfig.effect !== 'Solid' ? 'Overlay Model Effect' : 'Overlay Model Clear',
        multisyncCommand: wledControlConfig.multisync,
        multisyncHosts: wledControlConfig.systems.join(','),
        args
      }),
      contentType: 'application/json',
      success: function (data) {
        console.log('WLED effects stopped successfully')
      }
    })
  }

  function togglePower() {
    wledControlConfig.power = !wledControlConfig.power
    SaveWledControlConfig()
    if (wledControlConfig.power) {
      RunWledEffect()
    } else {
      stopWledEffects()
    }
    updateUIFromConfig()
  }

  function handleModelChecked() {
    const checkedModels = []
    $('.model-checkbox:checked').each(function () {
      checkedModels.push($(this).data('model-id'))
    })
    wledControlConfig.models = checkedModels
    SaveWledControlConfig()
  }

  function updateUIFromConfig() {
    // Update brightness slider
    $('#brightnessSlider').val(wledControlConfig.brightness)

    // Update model checkboxes
    $('.model-checkbox').each(function () {
      const modelId = $(this).data('model-id')
      $(this).prop('checked', wledControlConfig.models.includes(modelId))
    })

    // Update power button
    $('#powerButton').toggleClass('active', wledControlConfig.power)
    setWledEffect(wledControlConfig.effect)
    // Update selected palette
    $('.palette-btn').removeClass('selected');
    $(`.palette-btn:contains("${wledControlConfig.selectedPalette}")`).addClass('selected');
  }

  const colorPicker = new iro.ColorPicker('#colorPicker', {
    width: 300,
    borderWidth: 0,
    padding: 4,
    wheelLightness: false,
    wheelAngle: 270,
    wheelDirection: 'clockwise',
    layout: [
      {
        component: iro.ui.Wheel,
        options: {}
      },
      {
        component: iro.ui.Slider,
        options: {
          sliderType: 'value',
          width: 300,
          height: 28
        }
      },
      {
        component: iro.ui.Slider,
        options: {
          sliderType: 'saturation',
          width: 300,
          height: 28
        }
      }
    ]
  })

  let selectedColorIndex = 0 // Track which color is currently selected

  function updateCustomColorDisplay() {
    for (let i = 0; i < 3; i++) {
      const $button = $(`#customColor${i + 1}`)
      if (wledControlConfig.colors[i]) {
        $button.css('background-color', wledControlConfig.colors[i])
        $button.removeClass('empty').addClass('filled')
        $button.html(
          `<span>${i + 1}</span>${i > 0 ? '<span class="remove-color">×</span>' : ''
          }`
        )
      } else {
        $button.css('background-color', 'transparent')
        $button.removeClass('filled').addClass('empty')
        $button.html('<span class="add-color">+</span>')
      }
      $button.toggleClass('selected', i === selectedColorIndex)
    }
    if (!$('.palette-btn.selected').length) {
      selectColorsOnlyPalette();
    }
    updateSpecialPaletteBackgrounds();
  }

  $('.color-preset').click(function () {
    selectColorsOnlyPalette();
    if ($(this).hasClass('random-preset')) {
      const randomColor =
        '#' + Math.floor(Math.random() * 16777215).toString(16)
      colorPicker.color.set(randomColor)
    } else {
      const color = $(this).css('background-color')
      colorPicker.color.set(color)
    }
    wledControlConfig.colors[selectedColorIndex] = colorPicker.color.hexString
    SaveWledControlConfig()
  })

  function setWledEffect(effectName) {
    if (effectName === 'Solid') {
      wledControlConfig.effect = 'Solid'
      SaveWledControlConfig()
      updateEffectControls([])
      updateCustomColorDisplay()
      checkAndRunEffect()
    } else {
      $.get('api/overlays/effects/' + effectName).done(function (data) {
        wledControlConfig.effect = effectName
        wledControlConfig.colors = []
        wledControlConfig.effectDetails = {}

        specialPalettes = specialPalettes.filter(p => p.name !== 'Default');

        data.args.forEach(arg => {
          if (arg.type === 'range') {
            if (arg.name === 'Brightness') {
              wledControlConfig.effectDetails[arg.name] = wledControlConfig.brightness
            } else {
              wledControlConfig.effectDetails[arg.name] = parseInt(arg.default)
            }
          } else if (arg.type === 'color') {
            wledControlConfig.colors.push(arg.default)
          } else if (arg.type === 'string' && arg.contents) {
            if (arg.name === 'Palette') {
              const defaultPalette = arg.default || arg.contents[0];
              const defaultColors = data.args.filter(a => a.type === 'color').map(a => a.default);
              wledControlConfig.effectDetails[arg.name] = defaultPalette;
              wledControlConfig.selectedPalette = defaultPalette;
              if (defaultPalette && !defaultPalette.startsWith('*')) {
                specialPalettes.unshift({
                  name: 'Default',
                  colors: [defaultColors[0]]
                });
              }
            } else {
              wledControlConfig.effectDetails[arg.name] = arg.default || arg.contents[0]
            }
          }
        })

        SaveWledControlConfig()
        updateEffectControls(data.args)
        updateCustomColorDisplay()
        populatePalettes()
        checkAndRunEffect()
      })
    }
  }

  function updateEffectControls(effectArgs) {
    const controlsContainer = $('#effectControls')
    controlsContainer.empty()

    // Add dropdowns first
    effectArgs.forEach(arg => {
      if (arg.type === 'string' && arg.contents) {
        controlsContainer.append(createDropdown(arg))
      }
    })

    // Always add brightness slider next
    controlsContainer.append(
      createIconSlider({
        name: 'Brightness',
        min: 0,
        max: 255,
        default: wledControlConfig.brightness
      })
    )

    // Add other sliders
    effectArgs.forEach(arg => {
      if (arg.type === 'range' && arg.name !== 'Brightness') {
        controlsContainer.append(createLabeledSlider(arg))
      }
    })

    updateControlValues()
    updatePaletteDropdown() 
  }

  function createIconSlider(arg) {
    return `
        <div class="slider-container">
            <div class="slider-wrapper">
                <i class="material-icons">brightness_medium</i>
                <input type="range" id="${arg.name}Slider" min="${arg.min}" max="${arg.max}" value="${arg.default}">
            </div>
        </div>
    `
  }

  function createLabeledSlider(arg) {
    return `
        <div class="slider-container">
            <label for="${arg.name}Slider">${arg.name}</label>
            <div class="slider-wrapper">
                <input type="range" id="${arg.name}Slider" min="${arg.min}" max="${arg.max}" value="${arg.default}">
            </div>
        </div>
    `
  }

  function createDropdown(arg) {
    let options = arg.contents
      .map(
        item =>
          `<option value="${item}" ${item === wledControlConfig.effectDetails[arg.name] ? 'selected' : ''
          }>${item}</option>`
      )
      .join('')

    return `
        <div class="dropdown-container">
            <label for="${arg.name}Dropdown">${arg.name}</label>
            <select id="${arg.name}Dropdown" class="effect-dropdown">
                ${options}
            </select>
        </div>
    `
  }

  function updateControlValues() {
    $('#BrightnessSlider').val(wledControlConfig.brightness)

    Object.entries(wledControlConfig.effectDetails).forEach(([name, value]) => {
      const slider = $(`#${name}Slider`)
      const dropdown = $(`#${name}Dropdown`)

      if (slider.length) {
        slider.val(value)
      } else if (dropdown.length) {
        dropdown.val(value)
      }
    })
  }


  function populateEffectsList(effects) {
    const effectList = $('#effectList')
    effectList.empty()

    addEffectButton('Solid', effectList)

    // Add the rest of the effects
    effects.forEach(effect => {
      addEffectButton(effect, effectList)
    })
  }

  function addEffectButton(effect, container) {
    const button = $('<button>')
      .addClass('effect-btn')
      .attr('data-effect-id', effect)
      .text(effect)

    container.append(button)
  }

  // This function should be called when you receive the list of effects from the server
  function getEffectsList() {
    $.get('api/overlays/effects').done(function (data) {
      populateEffectsList(data)
    })
  }

  // Tab switching
  $('.tab-btn').click(function () {
    const tabId = $(this).data('tab')
    console.log('Clicked tab:', tabId) // Debug log
    $('.tab-btn').removeClass('active')
    $(this).addClass('active')
    $('.tab-content').hide()
    $(`#${tabId}`).show()
    console.log('Shown tab:', $(`#${tabId}`).attr('id')) // Debug log
  })

  // Initialize tabs (show the first tab)
  $('.tab-btn:first').click()

  // Effect selection
  $('#effectList').on('click', '.effect-btn', function () {
    const effectId = $(this).data('effect-id')
    selectEffect(effectId)
  })

  function selectEffect(effectName) {
    $('.effect-btn').removeClass('active')
    $(`.effect-btn[data-effect-id="${effectName}"]`).addClass('active')
    setWledEffect(effectName)
  }

  // Search functions
  window.searchPalettes = function (query) {
    query = query.toLowerCase()
    $('.palette-btn').each(function () {
      const paletteName = $(this).find('.palette-name').text().toLowerCase()
      $(this).toggle(paletteName.includes(query))
    })
  }

  window.searchEffects = function (query) {
    query = query.toLowerCase()
    $('.effect-btn').each(function () {
      const effectName = $(this).find('.effect-name').text().toLowerCase()
      $(this).toggle(effectName.includes(query))
    })
  }

  function populateModels() {
    $.ajax({
      url: 'api/overlays/models',
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        const modelList = $('#modelList')
        modelList.empty()
        data.forEach((model, index) => {
          modelList.append(`
                        <div class="model-btn">
                            <input type="checkbox" id="model-${index}" class="model-checkbox" data-model-id="${model.Name}">
                            <label for="model-${index}" class="model-name">${model.Name}</label>
                        </div>
                    `)
        })
      },
      error: function (xhr, status, error) {
        console.error('Error fetching models:', error)
        $('#modelList').html(
          '<p>Error loading models. Please try again later.</p>'
        )
      }
    })
  }

  populateModels()

  // Handle model checkbox changes
  $('#modelList').on('change', '.model-checkbox', function () {
    handleModelChecked()
  })

  // Search function for models
  window.searchModels = function (query) {
    query = query.toLowerCase()
    $('.model-btn').each(function () {
      const modelName = $(this).find('.model-name').text().toLowerCase()
      $(this).toggle(modelName.includes(query))
    })
  }

  // Update brightness slider handler
  $('#brightnessSlider').on('input', function () {
    wledControlConfig.brightness = parseInt($(this).val())
    SaveWledControlConfig()
  })

  // Power button click handler
  $('#powerButton').on('click', function () {
    togglePower()
  })

  // Custom color selection
  $('.custom-color').on('click', function (e) {
    const index = $('.custom-color').index(this);
    selectedColorIndex = index;
    if ($(e.target).hasClass('remove-color')) {
      wledControlConfig.colors[index] = null;
      updateCustomColorDisplay();
    } else if (wledControlConfig.colors[index]) {
      colorPicker.color.set(wledControlConfig.colors[index]);
    } else {
      // Add a new color
      wledControlConfig.colors[index] = colorPicker.color.hexString;
    }
    updateCustomColorDisplay();
    SaveWledControlConfig();
    
    // Update the selected palette to "Colors Only" if it's not already a special palette
    const currentPalette = $('.palette-btn.selected .palette-name').text();
    if (!currentPalette.startsWith('*')) {
      selectColorsOnlyPalette();
    }
  })

  $('.color-preset').click(function () {
    const color = $(this).css('background-color')
    const hexColor = rgbToHex(color)
    colorPicker.color.set(hexColor)
    wledControlConfig.colors[selectedColorIndex] = hexColor
    updateCustomColorDisplay()
    SaveWledControlConfig()
  })

  $('#saveCustomPalette').click(function () {
    $('#customPaletteModal').show()
  })

  $('#confirmSavePalette').click(function () {
    const paletteName = $('#customPaletteName').val()
    if (paletteName) {
      const newPalette = {
        name: paletteName,
        colors: wledControlConfig.colors.filter(color => color !== null)
      }

      if (!wledControlConfig.customPalettes) {
        wledControlConfig.customPalettes = []
      }
      wledControlConfig.customPalettes.unshift(newPalette)
      SaveWledControlConfig()
      populatePalettes()
      $('#customPaletteModal').hide()
      $('#customPaletteName').val('')
      isCustomPaletteModified = false
      updateCustomColorDisplay()
    }
  })

  $('#cancelSavePalette').click(function () {
    $('#customPaletteModal').hide()
    $('#customPaletteName').val('')
  })

  function rgbToHex(rgb) {
    // If rgb is already a hex value, return it
    if (rgb.startsWith('#')) {
      return rgb
    }

    let sep = rgb.indexOf(',') > -1 ? ',' : ' '
    rgb = rgb.substr(4).split(')')[0].split(sep)
    let r = (+rgb[0]).toString(16),
      g = (+rgb[1]).toString(16),
      b = (+rgb[2]).toString(16)

    if (r.length == 1) r = '0' + r
    if (g.length == 1) g = '0' + g
    if (b.length == 1) b = '0' + b

    return '#' + r + g + b
  }

  $('#effectControls').on('change', 'select.effect-dropdown', function () {
    const name = this.id.replace('Dropdown', '')
    wledControlConfig.effectDetails[name] = $(this).val()
    SaveWledControlConfig()
    checkAndRunEffect()
  })

  $('#effectControls').on('input', 'input[type="range"]', function () {
    const name = this.id.replace('Slider', '')
    if (name === 'Brightness') {
      wledControlConfig.brightness = parseInt($(this).val())
    } else {
      wledControlConfig.effectDetails[name] = parseInt($(this).val())
    }
    SaveWledControlConfig()
    checkAndRunEffect()
  })

  function checkAndRunEffect() {
    if (wledControlConfig.power) {
      RunWledEffect()
    }
  }

  function initializeColorPickers() {
    if (wledControlConfig.colors[0]) {
      colorPicker.color.set(wledControlConfig.colors[0])
    }
    updateCustomColorDisplay()
  }

  colorPicker.on('color:change', function(color) {
    wledControlConfig.colors[selectedColorIndex] = color.hexString;
    updateCustomColorDisplay();
    
    if (!updatingColorBasedOnPalette && !initializing && !wledControlConfig.selectedPalette.startsWith('*')) {
      selectColorsOnlyPalette();
    }
    
    updatingColorBasedOnPalette = false;
    
    SaveWledControlConfig();
  });

  // Palette Functions

  function createGradientString(colors) {
    if (colors.length === 1) {
      return colors[0];
    }
    const stops = colors.map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  function addPaletteButton(palette, container, index, isSpecial) {
    const isSelected = wledControlConfig.selectedPalette === palette.name;
    const paletteType = isSpecial ? 'special-palette' : 'custom-palette';
    const indexAttr = isSpecial ? `data-special-palette-index="${index}"` : `data-custom-palette-index="${index}"`;
    
    container.append(`
      <button class="palette-btn ${paletteType} ${isSelected ? 'selected' : ''}" data-palette-name="${palette.name}" ${indexAttr}>
        <span class="palette-name">${palette.name}</span>
        <div class="palette-preview"></div>
      </button>
    `);
  }

  function populatePalettes() {
    const paletteList = $('#paletteList')
    paletteList.empty()

    const defaultPalette = specialPalettes.find(p => p.name === 'Default');
    if (defaultPalette) {
      const isSelected = wledControlConfig.selectedPalette === defaultPalette.name;
      const gradientColors = createGradientString(defaultPalette.colors);
        paletteList.append(`
          <button class="palette-btn special-palette ${isSelected ? 'selected' : ''}" data-palette-name="${defaultPalette.name}" data-special-palette-index="0">
            <span class="palette-name">${defaultPalette.name}</span>
            <div class="palette-preview" style="background: ${gradientColors};"></div>
          </button>
        `)
    }

    specialPalettes.forEach((palette, index) => {
      if (palette.name !== 'Default') {
        addPaletteButton(palette, paletteList, index, true);
      }
    });

    // Add custom palettes first
    if (wledControlConfig.customPalettes) {
      wledControlConfig.customPalettes.forEach((palette, index) => {
        const gradientColors = createGradientString(palette.colors);
        const isSelected = wledControlConfig.selectedPalette === palette.name;
        paletteList.append(`
          <button class="palette-btn custom-palette ${isSelected ? 'selected' : ''}" data-palette-name="${palette.name}" data-custom-palette-index="${index}">
            <span class="palette-name">${palette.name}</span>
            <div class="palette-preview" style="background: ${gradientColors};"></div>
          </button>
        `)
      })
    }

    existingPalettes.forEach((palette, index) => {
      const gradientColors = createGradientString(palette.colors);
      const isSelected = wledControlConfig.selectedPalette === palette.name;
      paletteList.append(`
        <button class="palette-btn ${isSelected ? 'selected' : ''}" data-palette-name="${palette.name}" data-palette-index="${index}">
          <span class="palette-name">${palette.name}</span>
          <div class="palette-preview" style="background: ${gradientColors};"></div>
        </button>
      `);
    });

    // Set the background for special palettes
    updateSpecialPaletteBackgrounds();
  }

  function updateSpecialPaletteBackgrounds() {
    const customColors = wledControlConfig.colors.filter(color => color !== null);
  
    $('.special-palette').each(function() {
      const paletteName = $(this).find('.palette-name').text();
      const previewDiv = $(this).find('.palette-preview');
      switch (paletteName) {
        case "* Color 1":
          previewDiv.css('background', customColors[0] || '#000000');
          break;
        case "* Color Gradient":
          previewDiv.css('background', createGradientString([customColors[0] || '#000000', '#ffffff']));
          break;
        case "* Colors 1&2":
          previewDiv.css('background', createGradientString([customColors[0] || '#000000', customColors[1] || '#ffffff']));
          break;
        case "* Colors Only":
          previewDiv.css('background', createGradientString(customColors));
          break;
      }
    });
  }

  function selectColorsOnlyPalette() {
    $('.palette-btn').removeClass('selected');
    const colorsOnlyPalette = $('.palette-btn').filter(function() {
      return $(this).find('.palette-name').text() === '* Colors Only';
    });
    colorsOnlyPalette.addClass('selected');
    wledControlConfig.selectedPalette = '* Colors Only';
    SaveWledControlConfig();
  }

  $('#paletteList').on('click', '.palette-btn', function () {
    const paletteIndex = $(this).data('palette-index');
    let selectedPalette;
  
    if ($(this).hasClass('special-palette')) {
      const paletteIndex = $(this).data('special-palette-index');
      selectedPalette = specialPalettes[paletteIndex];
    } else if ($(this).hasClass('custom-palette')) {
      const customPaletteIndex = $(this).data('custom-palette-index');
      selectedPalette = wledControlConfig.customPalettes[customPaletteIndex];
    } else {
      const paletteIndex = $(this).data('palette-index');
      selectedPalette = existingPalettes[paletteIndex];
    }
  
    updatingColorBasedOnPalette = true;
  
    if (wledControlConfig.selectedPalette !== selectedPalette.name) {
      wledControlConfig.selectedPalette = selectedPalette.name;

      if (wledControlConfig.effectDetails.hasOwnProperty('Palette')) {
        wledControlConfig.effectDetails.Palette = selectedPalette.name;
      }
  
      // Update colors based on the selected palette
      if (selectedPalette.name.startsWith('*')) {
        // Handle special palettes
        switch (selectedPalette.name) {
          case "* Color 1":
            wledControlConfig.colors = [wledControlConfig.colors[0] || '#ffffff', null, null];
            break;
          case "* Color Gradient":
            // We'll handle this on the WLED side
            break;
          case "* Colors 1&2":
            wledControlConfig.colors = [wledControlConfig.colors[0] || '#ffffff', wledControlConfig.colors[1] || '#000000', null];
            break;
          case "* Colors Only":
            // Keep all non-null colors
            wledControlConfig.colors = wledControlConfig.colors.filter(color => color !== null);
            break;
        }
      } else {
        // Handle regular palettes
        wledControlConfig.colors = selectedPalette.colors.slice(0, 3);
        while (wledControlConfig.colors.length < 3) {
          wledControlConfig.colors.push(null);
        }
      }
  
      selectedColorIndex = 0;
      updateCustomColorDisplay();
      if (wledControlConfig.colors[0]) {
        colorPicker.color.set(wledControlConfig.colors[0]);
      }
      updatePaletteDropdown();
      SaveWledControlConfig();
    }
    updatingColorBasedOnPalette = false;
  });

  function updatePaletteDropdown() {
    const paletteDropdown = $('#PaletteDropdown');
    if (paletteDropdown.length) {
      paletteDropdown.empty();
      specialPalettes.concat(wledControlConfig.customPalettes, existingPalettes).forEach((palette) => {
        paletteDropdown.append(`<option value="${palette.name}">${palette.name}</option>`);
      });
      paletteDropdown.val(wledControlConfig.selectedPalette);
      
      // Remove any existing event listener
      paletteDropdown.off('change');
      
      // Add the new event listener
      paletteDropdown.on('change', function() {
        const selectedPaletteName = $(this).val();
        updateSelectedPalette(selectedPaletteName);
      });
    }
  
    $('.palette-btn').removeClass('selected');
    $(`.palette-btn[data-palette-name="${wledControlConfig.selectedPalette}"]`).addClass('selected');
  }

  function updateSelectedPalette(paletteName) {
    wledControlConfig.selectedPalette = paletteName;

    if (wledControlConfig.effectDetails.hasOwnProperty('Palette')) {
      wledControlConfig.effectDetails.Palette = paletteName;
    }
    
    // Update the palette buttons in the color tab
    $('.palette-btn').removeClass('selected');
    $(`.palette-btn[data-palette-name="${paletteName}"]`).addClass('selected');

    updatingColorBasedOnPalette = true;
    
    // Update the colors based on the selected palette
    const selectedPalette = findPaletteByName(paletteName);
    if (selectedPalette) {
      wledControlConfig.colors = selectedPalette.colors.slice(0, 3);
      wledControlConfig.selectedPalette = selectedPalette.name;
      while (wledControlConfig.colors.length < 3) {
        wledControlConfig.colors.push(null);
      }
      updateCustomColorDisplay();
      if (wledControlConfig.colors[0]) {
        colorPicker.color.set(wledControlConfig.colors[0]);
      }
    } else {updatingColorBasedOnPalette = false;}
    
    SaveWledControlConfig();
    updatePaletteDropdown();
  }
  
  function findPaletteByName(name) {
    return specialPalettes.find(p => p.name === name) ||
           wledControlConfig.customPalettes.find(p => p.name === name) ||
           existingPalettes.find(p => p.name === name);
  }

  populatePalettes()
  getEffectsList()

  
  GetWledControlConfig()
})