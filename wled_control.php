<?php

$skipJSsettings = 1;
require_once("common.php");

?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WLED Control Preview</title>
    <link href="css/wled_control.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
    <div class="top">
        <button class="top-btn" id="powerButton"><i class="material-icons">power_settings_new</i>Power</button>
        <div class="brightness-control">
          <span>Brightness</span>
          <input type="range" id="brightnessSlider" min="0" max="100" value="50">
        </div>
    </div>
    <div class="content">
        <div id="colorPicker"></div>
        <div class="color-controls">
          <div id="brightnessSlider"></div>
          <div id="saturationSlider"></div>
          <div class="color-presets">
              <button class="color-preset" style="background-color: red;"></button>
              <button class="color-preset" style="background-color: orange;"></button>
              <button class="color-preset" style="background-color: yellow;"></button>
              <button class="color-preset" style="background-color: white;"></button>
              <button class="color-preset" style="background-color: black;"></button>
              <button class="color-preset" style="background-color: purple;"></button>
              <button class="color-preset" style="background-color: blue;"></button>
              <button class="color-preset" style="background-color: teal;"></button>
              <button class="color-preset" style="background-color: green;"></button>
              <button class="color-preset random-preset">R</button>
          </div>
        </div>
        <div class="palette-section">
            <h3>
                <i class="material-icons palette-icon">palette</i>
                <span>Color palette</span>
            </h3>
            <div class="search-container">
                <i class="material-icons search-icon">search</i>
                <input type="text" placeholder="Search" class="search-input">
            </div>
            <div id="paletteList">
                <button class="palette-btn">
                    <span class="palette-name">Default</span>
                    <div class="palette-preview" style="background: linear-gradient(to right, #ff0000, #00ff00, #0000ff);"></div>
                </button>
                <button class="palette-btn">
                    <span class="palette-name">* Color 1</span>
                    <div class="palette-preview" style="background: #ff0000;"></div>
                </button>
                <button class="palette-btn">
                    <span class="palette-name">* Color Gradient</span>
                    <div class="palette-preview" style="background: linear-gradient(to right, #ff0000, #00ff00);"></div>
                </button>
                <button class="palette-btn">
                    <span class="palette-name">* Colors 1&2</span>
                    <div class="palette-preview" style="background: linear-gradient(to right, #ff0000, #0000ff);"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="bottom-tabs">
        <button class="tab-btn active" data-tab="Colors">
            <i class="material-icons">palette</i>Colors
        </button>
        <button class="tab-btn" data-tab="Effects">
            <i class="material-icons">auto_awesome</i>Effects
        </button>
        <button class="tab-btn" data-tab="Segments">
            <i class="material-icons">view_in_ar</i>Models
        </button>
        <button class="tab-btn" data-tab="Favorites">
            <i class="material-icons">schedule</i>Schedule
        </button>
    </div>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@jaames/iro@5"></script>
    <script src="js/wled_control.js"></script>
</body>
</html>
