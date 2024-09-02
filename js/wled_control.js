$(document).ready(function () {
  let wledControlConfig = {
    systems: [],
    models: [],
    brightness: 100,
    colors: [],
    multisync: false,
    effect: "WLED - Solid Pattern",
    power: false,
    customPalettes: [],
    effectDetails: {}
  };

  function GetWledControlConfig() {
    const url = '/api/configfile/plugin.fpp-WLED-Control.json';

    if (window.fetch) {
        // Use Fetch API if available
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("Config loaded successfully:", data);
                processConfig(data);
            })
            .catch(error => {
                console.error("Fetch error:", error);
                fallbackXHR();
            });
    } else {
        // Fall back to XMLHttpRequest if Fetch is not available
        fallbackXHR();
    }
  }

  function fallbackXHR() {
    const xhr = new XMLHttpRequest();
    const url = '/api/configfile/plugin.fpp-WLED-Control.json';

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    console.log("Config loaded successfully via XHR:", data);
                    processConfig(data);
                } catch (e) {
                    console.error("Failed to parse response as JSON:", e);
                    useDefaultConfig();
                }
            } else {
                console.error("XHR error. Status:", xhr.status);
                useDefaultConfig();
            }
        }
    };

    xhr.open('GET', url, true);
    xhr.send();
  }

  function processConfig(data) {
    wledControlConfig = data;
    if (!wledControlConfig.customPalettes) {
        wledControlConfig.customPalettes = [];
    }
    updateUIFromConfig();
    populatePalettes();
    getEffectsList();
  }

  function useDefaultConfig() {
    console.log("Using default configuration");
    wledControlConfig = {
        systems: [],
        models: [],
        brightness: 100,
        colors: [],
        multisync: false,
        effect: "WLED - Solid Pattern",
        power: false,
        customPalettes: [],
        effectDetails: {}
    };
    updateUIFromConfig();
    populatePalettes();
    getEffectsList();
  }

  function SaveWledControlConfig() {
    // Filter out null values before saving
    wledControlConfig.colors = wledControlConfig.colors.filter(color => color !== null);
    var data = JSON.stringify(wledControlConfig);
    $.ajax({
        type: "POST",
        url: "api/configfile/plugin.fpp-WLED-Control.json",
        dataType: "json",
        data: data,
        processData: false,
        contentType: "application/json",
        success: function () {
            console.log("WLED Control config saved successfully");
            checkAndRunEffect();
        },
        error: function (xhr, status, error) {
            console.error("Error saving WLED Control config:", error);
        },
    });
  }

  function CreateEffectJSON() {
    var json = {};
    json["command"] = "Overlay Model Effect";
    json["multisyncCommand"] = wledControlConfig.multisync;
    json["multisyncHosts"] = wledControlConfig.systems.join(',');
    json["args"] = [];
    json["args"].push(wledControlConfig.models.join(',')); //models
    json["args"].push("Enabled"); //multisync enabled
    json["args"].push(wledControlConfig.effect); //effect
    json["args"].push(wledControlConfig.brightness.toString());
    for (var key in wledControlConfig.effectDetails) {
        json["args"].push(wledControlConfig.effectDetails[key].toString());
    }
    wledControlConfig.colors.forEach(color => {
        json["args"].push(color);
    });
    return json;
  }

  function RunWledEffect() {
    var json = CreateEffectJSON();
    $.ajax({
      type: "POST",
      url: 'api/command',
      dataType: 'json',
      data: JSON.stringify(json),
      contentType: 'application/json',
      success: function (data) {
        console.log("WLED effect started successfully");
      }
    });
  }

  function stopWledEffects() {
    $.ajax({
      type: "POST",
      url: 'api/command',
      dataType: 'json',
      data: JSON.stringify({
        "command": "Overlay Model Effect",
        "multisyncCommand": wledControlConfig.multisync,
        "multisyncHosts": wledControlConfig.systems.join(','),
        "args": [
          wledControlConfig.models.join(','),
          "Enabled",
          "Stop Effects"
        ]
      }),
      contentType: 'application/json',
      success: function (data) {
        console.log("WLED effects stopped successfully");
      }
    });
  }

  function togglePower() {
    wledControlConfig.power = !wledControlConfig.power;
    SaveWledControlConfig();
    if (wledControlConfig.power) {
      RunWledEffect();
    } else {
      stopWledEffects();
    }
    updateUIFromConfig();
  }

  function handleModelChecked() {
    const checkedModels = [];
    $('.model-checkbox:checked').each(function () {
      checkedModels.push($(this).data('model-id'));
    });
    wledControlConfig.models = checkedModels;
    SaveWledControlConfig();
  }

  function updateUIFromConfig() {
    // Update brightness slider
    $('#brightnessSlider').val(wledControlConfig.brightness);

    // Update model checkboxes
    $('.model-checkbox').each(function () {
      const modelId = $(this).data('model-id');
      $(this).prop('checked', wledControlConfig.models.includes(modelId));
    });

    // Update power button
    $('#powerButton').toggleClass('active', wledControlConfig.power);
    //todo: check status to determine if effect is running and set power button state accordingly
    setWledEffect(wledControlConfig.effect);
  }

  //Color picker
  const colorPicker = new iro.ColorPicker("#colorPicker", {
    width: 260,
    color: "#ff0000",
    borderWidth: 0,
    padding: 4,
    wheelLightness: false,
    wheelAngle: 270,
    wheelDirection: "clockwise",
  });

  const saturationSlider = new iro.ColorPicker("#saturationSlider", {
    width: 300,
    color: "hsl(0, 100%, 50%)",
    borderWidth: 0,
    layout: [
      {
        component: iro.ui.Slider,
        options: {
          sliderType: "saturation",
        },
      },
    ],
  });
  
  let selectedColorIndex = 0; // Track which color is currently selected

  function updateCustomColorDisplay() {
    for (let i = 0; i < 3; i++) {
      const $button = $(`#customColor${i+1}`);
      if (wledControlConfig.colors[i]) {
        $button.css('background-color', wledControlConfig.colors[i]);
        $button.removeClass('empty').addClass('filled');
        $button.html(`<span>${i+1}</span>${i > 0 ? '<span class="remove-color">×</span>' : ''}`);
      } else {
        $button.css('background-color', 'transparent');
        $button.removeClass('filled').addClass('empty');
        $button.html('<span class="add-color">+</span>');
      }
      $button.toggleClass('selected', i === selectedColorIndex);
    }
  }

  // Color picker change event
  colorPicker.on('color:change', function(color) {
    $('#colorDisplay').css('background-color', color.hexString);
    wledControlConfig.colors[selectedColorIndex] = color.hexString;
    updateCustomColorDisplay();
    updateSaturationSlider(color);
    SaveWledControlConfig();
  });

  // Color picker click event
  $('#colorPicker').on('mousedown', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Try to get the wheel from the colorPicker UI
    let wheel;
    if (colorPicker.ui && Array.isArray(colorPicker.ui)) {
        wheel = colorPicker.ui.find(component => component.type === 'wheel');
    }

    if (wheel) {
        const hsv = wheel.input(x, y);
        if (hsv) {
            colorPicker.color.hsv = hsv;
        }
    } else {
        // Fallback: calculate HSV based on click position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const radius = Math.min(rect.width, rect.height) / 2;

        const hue = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2);
        const saturation = Math.min(1, Math.sqrt(dx * dx + dy * dy) / radius);

        colorPicker.color.hsv = { h: hue * 360, s: saturation * 100, v: colorPicker.color.value };
    }
  });

  $(".color-preset").click(function () {
    if ($(this).hasClass("random-preset")) {
      const randomColor =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      colorPicker.color.set(randomColor);
    } else {
      const color = $(this).css("background-color");
      colorPicker.color.set(color);
    }
    updateSaturationSlider(colorPicker.color);
    wledControlConfig.colors = [colorPicker.color.hexString];
    SaveWledControlConfig();
  });

  function setWledEffect(effectName) {
    $.get("api/overlays/effects/" + effectName).done(function(data) {
        wledControlConfig.effect = effectName;
        wledControlConfig.effectDetails = {};
        wledControlConfig.colors = []; // Clear existing colors
        
        data.args.forEach(arg => {
            if (arg.type === 'range') {
                wledControlConfig.effectDetails[arg.name] = parseInt(arg.default);
            } else if (arg.type === 'color') {
                wledControlConfig.colors.push(arg.default);
            } else if (arg.type === 'string' && arg.contents) {
                wledControlConfig.effectDetails[arg.name] = arg.default || arg.contents[0];
            }
        });
        
        SaveWledControlConfig();
        updateEffectControls(data.args);
        updateCustomColorDisplay();
        checkAndRunEffect();
    });
  }

  function updateEffectControls(effectArgs) {
    const controlsContainer = $('#effectControls');
    controlsContainer.empty();

    // Add dropdowns first
    effectArgs.forEach(arg => {
        if (arg.type === 'string' && arg.contents) {
            controlsContainer.append(createDropdown(arg));
        }
    });

    // Always add brightness slider next
    controlsContainer.append(createIconSlider({
        name: 'Brightness',
        min: 0,
        max: 255,
        default: wledControlConfig.brightness
    }));

    // Add other sliders
    effectArgs.forEach(arg => {
        if (arg.type === 'range' && arg.name !== 'Brightness') {
            controlsContainer.append(createLabeledSlider(arg));
        }
    });

    // Update slider and dropdown values from wledControlConfig
    updateControlValues();
  }

  function createIconSlider(arg) {
    return `
        <div class="slider-container">
            <div class="slider-wrapper">
                <i class="material-icons">brightness_medium</i>
                <input type="range" id="${arg.name}Slider" min="${arg.min}" max="${arg.max}" value="${arg.default}">
            </div>
        </div>
    `;
  }

  function createLabeledSlider(arg) {
    return `
        <div class="slider-container">
            <label for="${arg.name}Slider">${arg.name}</label>
            <div class="slider-wrapper">
                <input type="range" id="${arg.name}Slider" min="${arg.min}" max="${arg.max}" value="${arg.default}">
            </div>
        </div>
    `;
  }

  function createDropdown(arg) {
    let options = arg.contents.map(item => 
        `<option value="${item}" ${item === wledControlConfig.effectDetails[arg.name] ? 'selected' : ''}>${item}</option>`
    ).join('');

    return `
        <div class="dropdown-container">
            <label for="${arg.name}Dropdown">${arg.name}</label>
            <select id="${arg.name}Dropdown" class="effect-dropdown">
                ${options}
            </select>
        </div>
    `;
  }

  function updateControlValues() {
    $('#BrightnessSlider').val(wledControlConfig.brightness);
    
    Object.entries(wledControlConfig.effectDetails).forEach(([name, value]) => {
        const slider = $(`#${name}Slider`);
        const dropdown = $(`#${name}Dropdown`);
        
        if (slider.length) {
            slider.val(value);
        } else if (dropdown.length) {
            dropdown.val(value);
        }
    });
  }

  function populatePalettes() {
    const paletteList = $("#paletteList");
    paletteList.empty();

    // Add custom palettes first
    if (wledControlConfig.customPalettes) {
      wledControlConfig.customPalettes.forEach((palette, index) => {
        const gradientColors = palette.colors.join(', ');
        paletteList.append(`
                  <button class="palette-btn custom-palette" data-palette-index="${index}">
                      <span class="palette-name">${palette.name}</span>
                      <div class="palette-preview" style="background: linear-gradient(to right, ${gradientColors});"></div>
                  </button>
              `);
      });
    }

    // Add standard palettes
    palettes.forEach((palette, index) => {
      const gradientColors = palette.colors.join(', ');
      paletteList.append(`
                <button class="palette-btn" data-palette-index="${index}">
                    <span class="palette-name">${palette.name}</span>
                    <div class="palette-preview" style="background: linear-gradient(to right, ${gradientColors});"></div>
                </button>
            `);
    });
  }

  function populateEffectsList(effects) {
    const effectList = $('#effectList');
    effectList.empty();

    // Add "WLED - Solid" at the top if it exists
    const solidIndex = effects.findIndex(effect => effect === "WLED - Solid Pattern");
    if (solidIndex !== -1) {
        const solidEffect = effects.splice(solidIndex, 1)[0];
        addEffectButton(solidEffect, effectList);
    }

    // Add the rest of the effects
    effects.forEach(effect => {
        addEffectButton(effect, effectList);
    });
  }

  function addEffectButton(effect, container) {
    const button = $('<button>')
        .addClass('effect-btn')
        .attr('data-effect-id', effect)
        .text(effect);
    
    container.append(button);
  }

  // This function should be called when you receive the list of effects from the server
  function getEffectsList() {
    $.get("api/overlays/effects").done(function(data) {
        populateEffectsList(data);
    });
  }

  // Tab switching
  $(".tab-btn").click(function () {
    const tabId = $(this).data("tab");
    console.log("Clicked tab:", tabId); // Debug log
    $(".tab-btn").removeClass("active");
    $(this).addClass("active");
    $(".tab-content").hide();
    $(`#${tabId}`).show();
    console.log("Shown tab:", $(`#${tabId}`).attr("id")); // Debug log
  });

  // Initialize tabs (show the first tab)
  $(".tab-btn:first").click();

  // Palette selection
  $("#paletteList").on("click", ".palette-btn", function () {
    const paletteIndex = $(this).data("palette-index");
    let selectedPalette;
    
    if ($(this).hasClass('custom-palette')) {
        selectedPalette = wledControlConfig.customPalettes[paletteIndex];
    } else {
        selectedPalette = palettes[paletteIndex];
    }
    
    wledControlConfig.colors = selectedPalette.colors.slice(0, 3).map(color => rgbToHex(color));
    while (wledControlConfig.colors.length < 3) {
        wledControlConfig.colors.push(null);
    }
    selectedColorIndex = 0;
    updateCustomColorDisplay();
    if (wledControlConfig.colors[0]) {
        colorPicker.color.set(wledControlConfig.colors[0]);
        updateSaturationSlider(colorPicker.color);
    }
    SaveWledControlConfig();
  });

  // Effect selection
  $("#effectList").on("click", ".effect-btn", function () {
    const effectId = $(this).data("effect-id");
    selectEffect(effectId);
  });

  function selectEffect(effectName) {
    $('.effect-btn').removeClass('active');
    $(`.effect-btn[data-effect-id="${effectName}"]`).addClass('active');
    setWledEffect(effectName);
  }

  // Search functions
  window.searchPalettes = function (query) {
    query = query.toLowerCase();
    $(".palette-btn").each(function () {
      const paletteName = $(this).find(".palette-name").text().toLowerCase();
      $(this).toggle(paletteName.includes(query));
    });
  };

  window.searchEffects = function (query) {
    query = query.toLowerCase();
    $(".effect-btn").each(function () {
      const effectName = $(this).find(".effect-name").text().toLowerCase();
      $(this).toggle(effectName.includes(query));
    });
  };

  // Handle effect speed slider
  $("#effectSpeedSlider").on("input", function () {
    const speed = $(this).val();
    console.log("Effect speed:", speed);
    // Add code to apply the effect speed
  });

  // Handle effect intensity slider
  $("#effectIntensitySlider").on("input", function () {
    const intensity = $(this).val();
    console.log("Effect intensity:", intensity);
    // Add code to apply the effect intensity
  });

  function populateModels() {
    $.ajax({
      url: "api/overlays/models",
      method: "GET",
      dataType: "json",
      success: function (data) {
        const modelList = $("#modelList");
        modelList.empty();
        data.forEach((model, index) => {
          modelList.append(`
                        <div class="model-btn">
                            <input type="checkbox" id="model-${index}" class="model-checkbox" data-model-id="${model.Name}">
                            <label for="model-${index}" class="model-name">${model.Name}</label>
                        </div>
                    `);
        });
      },
      error: function (xhr, status, error) {
        console.error("Error fetching models:", error);
        $("#modelList").html(
          "<p>Error loading models. Please try again later.</p>"
        );
      },
    });
  }

  populateModels();

  // Handle model checkbox changes
  $("#modelList").on("change", ".model-checkbox", function () {
    handleModelChecked();
  });

  // Search function for models
  window.searchModels = function (query) {
    query = query.toLowerCase();
    $(".model-btn").each(function () {
      const modelName = $(this).find(".model-name").text().toLowerCase();
      $(this).toggle(modelName.includes(query));
    });
  };

  // Update brightness slider handler
  $('#brightnessSlider').on('input', function () {
    wledControlConfig.brightness = parseInt($(this).val());
    SaveWledControlConfig();
  });

  // Power button click handler
  $('#powerButton').on('click', function () {
    togglePower();
  });

  // Initialize by getting the current config
  GetWledControlConfig();

  // ... rest of your existing code ...

  let isCustomPaletteModified = false;

  // Custom color selection
  $('.custom-color').on('click', function() {
    const index = $('.custom-color').index(this);
    selectedColorIndex = index;
    if (wledControlConfig.colors[index]) {
        colorPicker.color.set(wledControlConfig.colors[index]);
    } else {
        // Add a new color
        wledControlConfig.colors[index] = colorPicker.color.hexString;
    }
    updateCustomColorDisplay();
    SaveWledControlConfig();
  });

  // Color preset buttons
  $('.color-preset').click(function() {
    const color = $(this).css('background-color');
    const hexColor = rgbToHex(color);
    colorPicker.color.set(hexColor);
    wledControlConfig.colors[selectedColorIndex] = hexColor;
    updateCustomColorDisplay();
    SaveWledControlConfig();
  });

  // Save custom palette button
  $('#saveCustomPalette').click(function() {
    $('#customPaletteModal').show();
  });

  // Confirm save custom palette
  $('#confirmSavePalette').click(function() {
    const paletteName = $('#customPaletteName').val();
    if (paletteName) {
      const newPalette = {
        name: paletteName,
        colors: wledControlConfig.colors.filter(color => color !== null)
      };
      
      if (!wledControlConfig.customPalettes) {
        wledControlConfig.customPalettes = [];
      }
      wledControlConfig.customPalettes.unshift(newPalette);
      SaveWledControlConfig();
      populatePalettes();
      $('#customPaletteModal').hide();
      $('#customPaletteName').val('');
      isCustomPaletteModified = false;
      updateCustomColorDisplay();
    }
  });

  // Cancel save custom palette
  $('#cancelSavePalette').click(function() {
    $('#customPaletteModal').hide();
    $('#customPaletteName').val('');
  });

  function rgbToHex(rgb) {
    // If rgb is already a hex value, return it
    if (rgb.startsWith('#')) {
        return rgb;
    }
    
    // Convert rgb(r, g, b) to hex
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    rgb = rgb.substr(4).split(")")[0].split(sep);
    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
  }

  // Add event listeners for dropdowns
  $('#effectControls').on('change', 'select.effect-dropdown', function() {
    const name = this.id.replace('Dropdown', '');
    wledControlConfig.effectDetails[name] = $(this).val();
    SaveWledControlConfig();
    checkAndRunEffect();
  });

  // Add event listeners for all sliders
  $('#effectControls').on('input', 'input[type="range"]', function() {
    const name = this.id.replace('Slider', '');
    if (name === 'Brightness') {
        wledControlConfig.brightness = parseInt($(this).val());
    } else {
        wledControlConfig.effectDetails[name] = parseInt($(this).val());
    }
    SaveWledControlConfig();
    checkAndRunEffect();
  });

  function checkAndRunEffect() {
    if (wledControlConfig.power) {
        RunWledEffect();
    }
  }

  // Add this function to initialize everything
  function initializeColorPickers() {
    if (wledControlConfig.colors[0]) {
        colorPicker.color.set(wledControlConfig.colors[0]);
        updateSaturationSlider(colorPicker.color);
    }
    updateCustomColorDisplay();
  }

  // Call this function when the page loads
  $(document).ready(function() {
    // ... other initialization code ...
    initializeColorPickers();
    populatePalettes();
    getEffectsList();
  });

  function updateSaturationSlider(color) {
    saturationSlider.color.hue = color.hue;
    saturationSlider.color.value = color.value;
  }

  // Existing saturation slider event
  saturationSlider.on("color:change", function (color) {
    colorPicker.color.saturation = color.saturation;
    updateCustomColorDisplay();
  });

  // Add this function to initialize everything
  function initializeColorPickers() {
    if (wledControlConfig.colors[0]) {
        colorPicker.color.set(wledControlConfig.colors[0]);
        updateSaturationSlider(colorPicker.color);
    }
    updateCustomColorDisplay();
  }

  // Call this function when the page loads
  $(document).ready(function() {
    // ... other initialization code ...
    initializeColorPickers();
    populatePalettes();
    getEffectsList();
  });
});
