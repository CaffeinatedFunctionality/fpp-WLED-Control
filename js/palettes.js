const specialPalettes = [
  { name: "* Color 1", colors: [] },
  { name: "* Color Gradient", colors: [] },
  { name: "* Colors 1&2", colors: [] },
  { name: "* Colors Only", colors: [] }
];

const existingPalettes = [
  { name: "Sunset", colors: ["#FF0000", "#FFA500", "#FFFF00"] },
  { name: "Rivendell", colors: ["#1C2A4A", "#4F6B9B", "#B5D2E5"] },
  { name: "Breeze", colors: ["#016E7F", "#0199B2", "#90DCFF"] },
  { name: "Red & Blue", colors: ["#FF0000", "#0000FF"] },
  { name: "Yellowout", colors: ["#FFFF00", "#FFD700", "#FFA500"] },
  { name: "Analogous", colors: ["#00FFFF", "#00FF00", "#FFFF00"] },
  { name: "Splash", colors: ["#FF00FF", "#FF1493", "#FF69B4"] },
  { name: "Pastel", colors: ["#FFB6C1", "#FFA07A", "#FAFAD2"] },
  { name: "Sunset2", colors: ["#FF4500", "#FF6347", "#FF7F50"] },
  { name: "Beech", colors: ["#8B4513", "#DEB887", "#F4A460"] },
  { name: "Vintage", colors: ["#800000", "#8B4513", "#CD853F"] },
  { name: "Departure", colors: ["#FF4500", "#FF8C00", "#FFA500"] },
  { name: "Landscape", colors: ["#006400", "#228B22", "#32CD32"] },
  { name: "Beach", colors: ["#00FFFF", "#E0FFFF", "#AFEEEE"] },
  { name: "Sherbet", colors: ["#FF69B4", "#FF1493", "#FF00FF"] },
  { name: "Hult", colors: ["#00FFFF", "#00FF00", "#FFFF00"] },
  { name: "Hult64", colors: ["#00FFFF", "#00FF00", "#FFFF00", "#FF0000"] },
  { name: "Drywet", colors: ["#00FFFF", "#0000FF", "#8B0000"] },
  { name: "Jul", colors: ["#FF0000", "#FF4500", "#FFA500"] },
  { name: "Grintage", colors: ["#8B4513", "#CD853F", "#DEB887"] },
  { name: "Rewhi", colors: ["#FF0000", "#FF4500", "#FFA500"] },
  { name: "Tertiary", colors: ["#0000FF", "#00FF00", "#FF0000"] },
  { name: "Fire", colors: ["#8B0000", "#FF0000", "#FF4500"] },
  { name: "Icefire", colors: ["#00FFFF", "#0000FF", "#FF00FF"] },
  { name: "Cyane", colors: ["#00FFFF", "#00FF00", "#FFFF00"] },
  { name: "Light Pink", colors: ["#FFB6C1", "#FF69B4", "#FF1493"] },
  { name: "Autumn", colors: ["#FF4500", "#FF8C00", "#FFA500"] },
  { name: "Magenta", colors: ["#8B008B", "#FF00FF", "#FF1493"] },
  { name: "Magred", colors: ["#8B008B", "#FF00FF", "#FF0000"] },
  { name: "Yelmag", colors: ["#FF00FF", "#FF0000", "#FFFF00"] },
  { name: "Yelblu", colors: ["#0000FF", "#00FFFF", "#FFFF00"] },
  { name: "Orange & Teal", colors: ["#FF4500", "#008080"] },
  { name: "Tiamat", colors: ["#0000FF", "#00FFFF", "#FF00FF"] },
  { name: "April Night", colors: ["#00008B", "#0000FF", "#00FFFF"] },
  { name: "Orangery", colors: ["#FF4500", "#FF8C00", "#FFA500"] },
  { name: "C9", colors: ["#FF0000", "#FFA500", "#008000", "#0000FF"] },
  { name: "Sakura", colors: ["#FFB7C5", "#FF69B4", "#FF1493"] },
  { name: "Aurora", colors: ["#00FFFF", "#00FF00", "#FFFF00"] },
  { name: "Atlantica", colors: ["#000080", "#0000FF", "#00FFFF"] },
  { name: "C9 2", colors: ["#008000", "#0000FF", "#FF0000", "#FFA500", "#FFFF00"] },
  { name: "C9 New", colors: ["#FF0000", "#FFA500", "#008000", "#0000FF"] },
  { name: "Temperature", colors: ["#0000FF", "#00FFFF", "#FFFF00", "#FF0000"] },
  { name: "Aurora 2", colors: ["#0000FF", "#00FFFF", "#00FF00", "#FFFF00"] },
  { name: "Retro Clown", colors: ["#FF0000", "#FFFF00", "#00FF00"] },
  { name: "Candy", colors: ["#FF69B4", "#FF1493", "#FF00FF"] },
  { name: "Toxy Reaf", colors: ["#00FF00", "#FFFF00", "#FF00FF"] },
  { name: "Fairy Reaf", colors: ["#FF00FF", "#00FFFF", "#FFFFFF"] },
  { name: "Semi Blue", colors: ["#000080", "#0000FF", "#00FFFF"] },
  { name: "Pink Candy", colors: ["#FF69B4", "#FF1493", "#FF00FF"] },
  { name: "Red Reaf", colors: ["#8B0000", "#FF0000", "#FF4500"] },
  { name: "Aqua Flash", colors: ["#00FFFF", "#FFFF00", "#FFFFFF"] },
  { name: "Yelblu Hot", colors: ["#0000FF", "#00FFFF", "#FFFF00"] },
  { name: "Lite Light", colors: ["#FFFFFF", "#FFFFE0", "#FFFACD"] },
  { name: "Red Flash", colors: ["#8B0000", "#FF0000", "#FF4500"] },
  { name: "Blink Red", colors: ["#8B0000", "#FF0000", "#FF1493"] },
  { name: "Red Shift", colors: ["#8B0000", "#FF0000", "#FF4500"] },
  { name: "Red Tide", colors: ["#8B0000", "#FF0000", "#FF4500"] },
  { name: "Candy2", colors: ["#FF69B4", "#FF1493", "#FF00FF"] }
];

const palettes = [...specialPalettes, ...existingPalettes];

function populatePalettes () {
  const paletteList = $('#paletteList')
  paletteList.empty()

  // Add custom palettes first
  if (wledControlConfig.customPalettes) {
    wledControlConfig.customPalettes.forEach((palette, index) => {
      const gradientColors = palette.colors.join(', ')
      paletteList.append(`
                <button class="palette-btn custom-palette" data-palette-index="${index}">
                    <span class="palette-name">${palette.name}</span>
                    <div class="palette-preview" style="background: linear-gradient(to right, ${gradientColors});"></div>
                </button>
            `)
    })
  }

  // Add standard palettes
  palettes.forEach((palette, index) => {
    const paletteButton = $('<button>')
      .addClass('palette-btn')
      .attr('data-palette-index', index)
      .text(palette.name);

    if (palette.colors.length > 0) {
      const gradientColors = palette.colors.map(color => `${color} ${(100 / palette.colors.length).toFixed(2)}%`).join(', ');
      paletteButton.css('background', `linear-gradient(to right, ${gradientColors})`);
    } else {
      // For special palettes, we'll set the background later
      paletteButton.addClass('special-palette');
    }

    paletteList.append(paletteButton);
  });

  // Set the background for special palettes
  updateSpecialPaletteBackgrounds();
}

function updateSpecialPaletteBackgrounds() {
  const customColors = wledControlConfig.colors.filter(color => color !== null);

  $('.special-palette').each(function() {
    const paletteName = $(this).text();
    switch (paletteName) {
      case "* Color 1":
        $(this).css('background', customColors[0] || '#000000');
        break;
      case "* Color Gradient":
        $(this).css('background', `linear-gradient(to right, ${customColors[0] || '#000000'}, #ffffff)`);
        break;
      case "* Colors 1&2":
        $(this).css('background', `linear-gradient(to right, ${customColors[0] || '#000000'} 50%, ${customColors[1] || '#ffffff'} 50%)`);
        break;
      case "* Colors Only":
        const gradientColors = customColors.map(color => `${color} ${(100 / customColors.length).toFixed(2)}%`).join(', ');
        $(this).css('background', `linear-gradient(to right, ${gradientColors})`);
        break;
    }
  });
}

function unselectPalette() {
  $('.palette-btn').removeClass('selected');
  wledControlConfig.selectedPaletteIndex = -1;
}

$('#paletteList').on('click', '.palette-btn', function () {
  $('.palette-btn').removeClass('selected');
  $(this).addClass('selected');
  
  const paletteIndex = $(this).data('palette-index');
  const selectedPalette = palettes[paletteIndex];

  if (selectedPalette.name.startsWith('*')) {
    // Handle special palettes
    switch (selectedPalette.name) {
      case "* Color 1":
        wledControlConfig.colors = [wledControlConfig.colors[0], null, null];
        break;
      case "* Color Gradient":
        // We'll handle this on the WLED side
        break;
      case "* Colors 1&2":
        wledControlConfig.colors = [wledControlConfig.colors[0], wledControlConfig.colors[1], null];
        break;
      case "* Colors Only":
        // Keep all non-null colors
        wledControlConfig.colors = wledControlConfig.colors.filter(color => color !== null);
        break;
    }
  } else {
    // Handle regular palettes as before
    wledControlConfig.colors = selectedPalette.colors.slice(0, 3);
    while (wledControlConfig.colors.length < 3) {
      wledControlConfig.colors.push(null);
    }
  }

  wledControlConfig.palette = selectedPalette.name;
  selectedColorIndex = 0;
  updateCustomColorDisplay();
  if (wledControlConfig.colors[0]) {
    colorPicker.color.set(wledControlConfig.colors[0]);
    updateSaturationSlider(colorPicker.color);
  }
  SaveWledControlConfig();
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

function customColorsToPaletteJson() {
  const colors = wledControlConfig.colors.filter(color => color !== null);
  const colorStops = colors.map((color, index) => {
    const position = Math.round((index / (colors.length - 1)) * 255);
    return [position, color];
  });
  return JSON.stringify(colorStops);
}