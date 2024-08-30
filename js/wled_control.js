$(document).ready(function () {
  let wledControlConfig = {
    systems: [],
    models: [],
    speed: 100,
    intensity: 100,
    brightness: 100,
    colors: [],
    multisync: false,
    effect: "WLED - Solid Pattern",
    power: false,
    customPalettes: [],
  };

  function GetWledControlConfig() {
    $.ajax({
      type: "GET",
      url: "api/configfile/plugin.fpp-WLED-Control.json",
      dataType: "json",
      contentType: "application/json",
      success: function (data) {
        wledControlConfig = data;
        if (!wledControlConfig.customPalettes) {
          wledControlConfig.customPalettes = [];
        }
        updateUIFromConfig();
        populatePalettes();
      },
      error: function (xhr, status, error) {
        console.error("Error fetching WLED Control config:", error);
      },
    });
  }

  function SaveWledControlConfig() {
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
    json["args"].push(wledControlConfig.models.join(','));
    json["args"].push("Enabled");
    json["args"].push(wledControlConfig.effect);
    for (var x = 1; x < 20; x++) {
      var inp = $("#wledTblCommandEditor_arg_" + x);
      var val = inp.val();
      if (inp.attr('type') == 'checkbox') {
        if (inp.is(":checked")) {
          json["args"].push("true");
        } else {
          json["args"].push("false");
        }
      } else if (inp.attr('type') == 'number' || inp.attr('type') == 'text') {
        json["args"].push(val);
      } else if (Array.isArray(val)) {
        json["args"].push(val.toString());
      } else if (typeof val != "undefined") {
        json["args"].push(val);
      }
    }
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
    if (wledControlConfig.power) {
      RunWledEffect();
    } else {
      stopWledEffects();
    }
    SaveWledControlConfig();
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

    // Update effect speed slider
    $('#effectSpeedSlider').val(wledControlConfig.speed);

    // Update effect intensity slider
    $('#effectIntensitySlider').val(wledControlConfig.intensity);

    // Update model checkboxes
    $('.model-checkbox').each(function () {
      const modelId = $(this).data('model-id');
      $(this).prop('checked', wledControlConfig.models.includes(modelId));
    });

    // Update power button
    $('#powerButton').toggleClass('active', wledControlConfig.power);
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
    layout: [
      {
        component: iro.ui.Wheel,
        options: {},
      },
    ],
  });

  const brightnessSlider = new iro.ColorPicker("#brightnessSlider", {
    width: 300,
    color: "rgb(255, 0, 0)",
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

  function setColor(rgb, hsv) {
    if (rgb === undefined) {
      rgb = colorPicker.color.rgb;
    }
    if (hsv === undefined) {
      hsv = colorPicker.color.hsv;
    }

    colorPicker.color.rgb = rgb;
    brightnessSlider.color.hsv = hsv;

    // Here you would typically send the color to your device
    console.log("Color set to:", rgb, hsv);
  }

  // Custom click handler for the color wheel
  $("#colorPicker").on("click", function (e) {
    const wheel = colorPicker.ui[0];
    const rect = wheel.el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = wheel.width / 2;
    const centerY = wheel.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;

    const radius = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = wheel.width / 2;

    let hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    hue = (hue + 90) % 360; // Adjust for wheel angle
    const saturation = Math.min(100, (radius / maxRadius) * 100);

    colorPicker.color.hsv = {
      h: hue,
      s: saturation,
      v: colorPicker.color.value,
    };
    setColor();
  });

  colorPicker.on("color:change", function (color) {
    updateSliders();
    brightnessSlider.color.hsv = {
      h: color.hue,
      s: color.saturation,
      v: color.value,
    };
  });

  brightnessSlider.on("color:change", function (color) {
    colorPicker.color.value = color.value;
    setColor();
  });

  saturationSlider.on("color:change", function (color) {
    colorPicker.color.saturation = color.saturation;
    setColor();
  });

  function updateSliders() {
    brightnessSlider.color.hue = colorPicker.color.hue;
    brightnessSlider.color.saturation = colorPicker.color.saturation;
  }

  $(".color-preset").click(function () {
    if ($(this).hasClass("random-preset")) {
      const randomColor =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      colorPicker.color.set(randomColor);
    } else {
      const color = $(this).css("background-color");
      colorPicker.color.set(color);
    }
    setColor();
  });

  function setWledEffect(options) {
    $.get("api/overlays/effects/" + options.effect).done(function (data) {
      $("#EffectName").html(options.effect);
      for (var x = 1; x < 25; x++) {
        $("#wledTblCommandEditor_arg_" + x + "_row").remove();
      }
      PrintArgInputs("wledTblCommandEditor", false, data["args"], 1);
      $("#fpp-WledEffects-Buttons").show();
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

  function populateEffects() {
    $.ajax({
      url: "api/overlays/effects",
      method: "GET",
      dataType: "json",
      success: function (data) {
        const effectList = $("#effectList");
        effectList.empty();
        data.forEach((effect, index) => {
          var effectButton = $(`
            <button class="effect-btn" data-effect-id="${effect}">
              <span class="effect-name">${effect}</span>
            </button>
          `).click(function () {
              setWledEffect({
                effect: v,
              });
            });
          effectList.append(effectButton);
        });
      },
      error: function (xhr, status, error) {
        console.error("Error fetching models:", error);
        $("#effectList").html(
          "<p>Error loading effects. Please try again later.</p>"
        );
      }
    });
  }

  populatePalettes();
  populateEffects();

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
    console.log(`Selected palette: ${palettes[paletteIndex].name}`);
    // Add code to apply the selected palette
  });

  // Effect selection
  $("#effectList").on("click", ".effect-btn", function () {
    const effectId = $(this).data("effect-id");
    console.log(
      `Selected effect: ${effects.find((e) => e.id === effectId).name}`
    );
    // Add code to apply the selected effect
  });

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

  // Update effect speed slider handler
  $('#effectSpeedSlider').on('input', function () {
    wledControlConfig.speed = parseInt($(this).val());
    SaveWledControlConfig();
  });

  // Update effect intensity slider handler
  $('#effectIntensitySlider').on('input', function () {
    wledControlConfig.intensity = parseInt($(this).val());
    SaveWledControlConfig();
  });

  // Power button click handler
  $('#powerButton').on('click', function () {
    togglePower();
  });

  // Initialize by getting the current config
  GetWledControlConfig();

  // ... rest of your existing code ...

  let customColors = ['#ff0000', '#00ff00', '#0000ff']; // Default colors
  let selectedCustomColorIndex = null;

  function updateCustomColorDisplay() {
    for (let i = 0; i < 3; i++) {
      $(`#customColor${i+1}`).css('background-color', customColors[i]);
    }
  }

  // Color picker change event
  colorPicker.on('color:change', function(color) {
    // ... existing color change code ...
    
    if (selectedCustomColorIndex !== null) {
      customColors[selectedCustomColorIndex] = color.hexString;
      updateCustomColorDisplay();
    }
  });

  // Custom color selection
  $('.custom-color').click(function() {
    if (this.id === 'saveCustomPalette') return;
    
    const index = $('.custom-color').index(this);
    $('.custom-color').removeClass('selected');
    $(this).addClass('selected');
    selectedCustomColorIndex = index;
    colorPicker.color.set(customColors[index]);
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
        colors: customColors.filter(color => color !== null)
      };
      
      if (!wledControlConfig.customPalettes) {
        wledControlConfig.customPalettes = [];
      }
      wledControlConfig.customPalettes.unshift(newPalette);
      SaveWledControlConfig();
      populatePalettes();
      $('#customPaletteModal').hide();
      $('#customPaletteName').val('');
    }
  });

  // Cancel save custom palette
  $('#cancelSavePalette').click(function() {
    $('#customPaletteModal').hide();
    $('#customPaletteName').val('');
  });

  updateCustomColorDisplay();
  populatePalettes();
});
