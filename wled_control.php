<?php

$skipJSsettings = 1;
require_once("common.php");

?>

<div class="head">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WLED Control</title>
  <link href="css/wled_control.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  </d>
  <div class="body">
    <div class="top">
      <button id="powerButton">
        <i class="material-icons">power_settings_new</i>
        <span>Power</span>
      </button>
      <div class="brightness-control">
        <i class="material-icons">brightness_medium</i>
        <input type="range" id="brightnessSlider" min="0" max="100" value="50">
      </div>
      <button id="settingsButton">
        <i class="material-icons">settings</i>
        <span>Settings</span>
      </button>
    </div>
    <div class="content">
      <div id="colorsTab" class="tab-content active">
        <div id="colorPicker"></div>
        <div id="saturationSlider"></div>
        <div class="color-controls">  
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
          <div class="custom-colors">
            <h3>
              <i class="material-icons palette-icon">palette</i>
              <span>Color palette</span>
            </h3>
            <button class="custom-color filled" id="customColor1"><span>1</span></button>
            <button class="custom-color empty" id="customColor2"><span class="add-color">+</span></button>
            <button class="custom-color empty" id="customColor3"><span class="add-color">+</span></button>
            <button id="saveCustomPalette" class="custom-color">
              <i class="material-icons">check</i>
            </button>
          </div>
        </div>
        <div class="palette-section">
          <div class="search-container">
            <i class="material-icons search-icon">search</i>
            <input type="text" placeholder="Search" class="search-input" oninput="searchPalettes(this.value)">
          </div>
          <div id="paletteList"></div>
        </div>
      </div>

      <div id="effectsTab" class="tab-content">
        <div id="effectControls"></div>
        <h3 class="effect-mode-title">Effect Mode</h3>
        <div class="search-container">
          <i class="material-icons search-icon">search</i>
          <input type="text" placeholder="Search effects" class="search-input" oninput="searchEffects(this.value)">
        </div>
        <div id="effectList"></div>
      </div>

      <!-- Add placeholders for other tabs -->
      <div id="modelsTab" class="tab-content">
        <h3 class="models-title">Models</h3>
        <div class="search-container">
          <i class="material-icons search-icon">search</i>
          <input type="text" placeholder="Search models" class="search-input" oninput="searchModels(this.value)">
        </div>
        <div id="modelList"></div>
      </div>

      <div id="scheduleTab" class="tab-content">
        <!-- Content for Favorites/Schedule tab -->
      </div>
    </div>

    <div class="bottom-tabs">
      <button class="tab-btn active" data-tab="colorsTab">
        <i class="material-icons">palette</i>Colors
      </button>
      <button class="tab-btn" data-tab="effectsTab">
        <i class="material-icons">auto_awesome</i>Effects
      </button>
      <button class="tab-btn" data-tab="modelsTab">
        <i class="material-icons">view_in_ar</i>Models
      </button>
      <button class="tab-btn" data-tab="scheduleTab">
        <i class="material-icons">schedule</i>Schedule
      </button>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@jaames/iro@5"></script>
    <script src="js/palettes.js"></script>
    <script src="js/wled_control.js"></script>

    <!-- Add this modal for the custom palette form -->
    <div id="customPaletteModal" class="modal">
      <div class="modal-content">
        <h2>Save Custom Palette</h2>
        <input type="text" id="customPaletteName" placeholder="Enter palette name">
        <button id="confirmSavePalette">Save</button>
        <button id="cancelSavePalette">Cancel</button>
      </div>
    </div>
  </div>