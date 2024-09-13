$(document).ready(function () {
  let wledControlConfig = {
    systems: [],
    models: [],
    brightness: 255,
    colors: [],
    multisync: false,
    effect: 'WLED - Solid Pattern',
    power: false,
    customPalettes: [],
    effectDetails: {},
    selectedPalette: '* Colors Only'
  }

  let updatingColorBasedOnPalette = false;

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
          fallbackXHR()
        })
    } else {
      fallbackXHR()
    }
  }

  function fallbackXHR() {
    const xhr = new XMLHttpRequest()
    const url = '/api/configfile/plugin.fpp-WLED-Control.json'

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            console.log('Config loaded successfully via XHR:', data)
            processConfig(data)
          } catch (e) {
            console.error('Failed to parse response as JSON:', e)
            useDefaultConfig()
          }
        } else {
          console.error('XHR error. Status:', xhr.status)
          useDefaultConfig()
        }
      }
    }

    xhr.open('GET', url, true)
    xhr.send()
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
    populatePalettes()
    getEffectsList()
  }

  function useDefaultConfig() {
    console.log('Using default configuration')
    wledControlConfig = {
      systems: [],
      models: [],
      brightness: 128,
      colors: [],
      multisync: false,
      effect: 'WLED - Solid Pattern',
      power: false,
      customPalettes: [],
      effectDetails: {}
    }
    updateUIFromConfig()
    populatePalettes()
    getEffectsList()
  }

  function SaveWledControlConfig() {
    // Filter out null values before saving
    wledControlConfig.colors = wledControlConfig.colors.filter(
      color => color !== null
    )

    wledControlConfig.selectedPaletteIndex = $('.palette-btn.selected').index();
    if (wledControlConfig.selectedPaletteIndex === -1) {
      wledControlConfig.selectedPaletteIndex = -1;
    }

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
    json['args'].push(wledControlConfig.effect) //effect
    for (var key in wledControlConfig.effectDetails) {
      if (key === "Palette" && wledControlConfig.customPalettes.includes(wledControlConfig.effectDetails[key])) {
        json['args'].push("* Colors Only")
      } else {
        json['args'].push(wledControlConfig.effectDetails[key].toString())
      }
    }
    wledControlConfig.effect === 'Solid'
      ? json['args'].push(wledControlConfig.colors[0])
      : wledControlConfig.colors.forEach(color => {
        json['args'].push(color)
      })
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
    $.ajax({
      type: 'POST',
      url: 'api/command',
      dataType: 'json',
      data: JSON.stringify({
        command: 'Overlay Model Effect',
        multisyncCommand: wledControlConfig.multisync,
        multisyncHosts: wledControlConfig.systems.join(','),
        args: [wledControlConfig.models.join(','), 'Enabled', 'Stop Effects']
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
    color: '#ff0000',
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
        wledControlConfig.effectDetails = {}
        wledControlConfig.colors = []

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
              wledControlConfig.effectDetails[arg.name] = wledControlConfig.palette || arg.default || arg.contents[0]
            } else {
              wledControlConfig.effectDetails[arg.name] = arg.default || arg.contents[0]
            }
          }
        })

        SaveWledControlConfig()
        updateEffectControls(data.args)
        updateCustomColorDisplay()
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
    
    if (!updatingColorBasedOnPalette && !wledControlConfig.palette.startsWith('*')) {
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

  function populatePalettes() {
    const paletteList = $('#paletteList')
    paletteList.empty()

    // Add custom palettes first
    if (wledControlConfig.customPalettes) {
      wledControlConfig.customPalettes.forEach((palette, index) => {
        const gradientColors = createGradientString(palette.colors);
        const isSelected = wledControlConfig.selectedPalette === palette.name;
        paletteList.append(`
          <button class="palette-btn custom-palette ${isSelected ? 'selected' : ''}" data-palette-index="${index}">
            <span class="palette-name">${palette.name}</span>
            <div class="palette-preview" style="background: ${gradientColors};"></div>
          </button>
        `)
      })
    }

    // Add standard palettes
    palettes.forEach((palette, index) => {
      const paletteButton = $('<button>')
        .addClass('palette-btn')
        .attr('data-palette-index', index)
        .html(`<span class="palette-name">${palette.name}</span><div class="palette-preview"></div>`);
    
      if (palette.colors.length > 0) {
        const gradientColors = createGradientString(palette.colors);
        paletteButton.find('.palette-preview').css('background', gradientColors);
      } else {
        paletteButton.addClass('special-palette');
      }
  
      if (wledControlConfig.selectedPalette === palette.name) {
        paletteButton.addClass('selected');
      }
    
      paletteList.append(paletteButton);
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
    wledControlConfig.palette = '* Colors Only';
    wledControlConfig.selectedPaletteIndex = palettes.findIndex(p => p.name === '* Colors Only');
    SaveWledControlConfig();
  }

  $('#paletteList').on('click', '.palette-btn', function () {
    const paletteIndex = $(this).data('palette-index');
    let selectedPalette;
  
    if ($(this).hasClass('custom-palette')) {
      selectedPalette = wledControlConfig.customPalettes[paletteIndex];
    } else {
      selectedPalette = palettes[paletteIndex];
    }
  
    updatingColorBasedOnPalette = true;
  
    if (wledControlConfig.palette !== selectedPalette.name) {
      wledControlConfig.palette = selectedPalette.name;
      wledControlConfig.selectedPaletteIndex = paletteIndex;
  
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

  function updateCustomColorDisplay() {
    for (let i = 0; i < 3; i++) {
      const color = wledControlConfig.colors[i];
      const customColorBtn = $(`#customColor${i + 1}`);

      if (color) {
        customColorBtn.removeClass('empty').addClass('filled').css('background-color', color);
        customColorBtn.find('span').text(i + 1);
      } else {
        customColorBtn.removeClass('filled').addClass('empty').css('background-color', '');
        customColorBtn.find('span').html('<span class="add-color">+</span>');
      }
    }

    updateSpecialPaletteBackgrounds();
  }

  function updatePaletteDropdown() {
    const paletteDropdown = $('#paletteDropdown');
    if (paletteDropdown.length) {
      paletteDropdown.empty();
      palettes.forEach((palette, index) => {
        if (!palette.name.startsWith('*')) {
          paletteDropdown.append(`<option value="${palette.name}">${palette.name}</option>`);
        }
      });
      wledControlConfig.customPalettes.forEach((palette, index) => {
        paletteDropdown.append(`<option value="${palette.name}">${palette.name}</option>`);
      });
      paletteDropdown.val(wledControlConfig.palette);
    }

    $('.palette-btn').removeClass('selected');
    $(`.palette-btn[data-palette-name="${wledControlConfig.palette}"]`).addClass('selected');
  }

  initializeColorPickers()
  populatePalettes()
  getEffectsList()
  GetWledControlConfig()

  function initializeBrightnessSlider() {
    $('#brightnessSlider').val(wledControlConfig.brightness);
  }
  
  GetWledControlConfig().then(() => {
    initializeBrightnessSlider();
  });
})