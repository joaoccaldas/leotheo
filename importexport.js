// importexport.js - Handles library data import and export functionality

(function (window) {
  "use strict";

  const IMPORT_EXPORT_FILENAME = "lulus-library-backup.json";
  const LOCAL_STORAGE_KEY = "webBookAppData";

  /**
   * Initializes the import/export functionality by adding buttons to the UI.
   */
  function initializeImportExport() {
    const controlsContainer = document.getElementById("import-export-controls");
    if (!controlsContainer) {
      console.warn("Import/Export controls container not found in HTML.");
      return;
    }

    // Clear any placeholder content
    controlsContainer.innerHTML = ""; 
    
    const wrapper = document.createElement('div');
    wrapper.className = "space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center items-center";


    // Create Export Button
    const exportButton = document.createElement("button");
    exportButton.id = "export-library-btn";
    exportButton.textContent = "Export Library";
    exportButton.title = "Download your current library as a JSON file";
    exportButton.className = "px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full md:w-auto";
    exportButton.addEventListener("click", handleExportLibrary);
    wrapper.appendChild(exportButton);

    // Create Import Label and Input
    // Using a label that wraps the input for better clickability
    const importLabel = document.createElement("label");
    importLabel.id = "import-library-label";
    importLabel.textContent = "Import Library";
    importLabel.title = "Upload a previously exported library JSON file";
    importLabel.className = "cursor-pointer px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors w-full md:w-auto text-center";
    
    const importInput = document.createElement("input");
    importInput.id = "import-library-input";
    importInput.type = "file";
    importInput.accept = ".json,application/json";
    importInput.className = "hidden"; // Hide the default file input
    importInput.addEventListener("change", handleImportLibrary);

    importLabel.appendChild(importInput); // Nest input inside label
    wrapper.appendChild(importLabel);

    controlsContainer.appendChild(wrapper);

    // Add some descriptive text
    const helpText = document.createElement('p');
    helpText.className = "mt-5 text-sm text-text-secondary text-center";
    helpText.innerHTML = `Export your library to create a backup or share it. <br class="sm:hidden"/>Import a previously exported <code>${IMPORT_EXPORT_FILENAME}</code> file to restore a library.`;
    controlsContainer.appendChild(helpText);
  }

  /**
   * Handles the library export process.
   */
  function handleExportLibrary() {
    try {
      const appDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!appDataString) {
        alert("No library data found to export. Create some books first!");
        console.warn("Export failed: No data in localStorage for key:", LOCAL_STORAGE_KEY);
        return;
      }

      // Validate if it's JSON before attempting to re-stringify (optional, but good practice)
      try {
        JSON.parse(appDataString); // Will throw error if not valid JSON
      } catch (e) {
        alert("Error: Your current library data appears to be corrupted and cannot be exported. Please contact support or try resetting your data.");
        console.error("Export failed: Data in localStorage is not valid JSON.", e);
        return;
      }
      
      const blob = new Blob([appDataString], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = IMPORT_EXPORT_FILENAME;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up

      alert(`Library exported successfully as ${IMPORT_EXPORT_FILENAME}!`);
      console.log("Library exported.");

    } catch (error) {
      console.error("Error during library export:", error);
      alert("An unexpected error occurred while exporting your library. Please try again.");
    }
  }

  /**
   * Handles the library import process when a file is selected.
   * @param {Event} event - The file input change event.
   */
  function handleImportLibrary(event) {
    const file = event.target.files?.[0];
    if (!file) {
      console.warn("Import cancelled or no file selected.");
      return;
    }

    if (file.type !== "application/json") {
      alert(`Invalid file type. Please select a .json file that was previously exported from this application. You selected: ${file.name} (Type: ${file.type || 'unknown'})`);
      event.target.value = null; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedDataString = e.target.result;
        const importedData = JSON.parse(importedDataString);

        // Basic validation of the imported data structure
        if (
          typeof importedData.userName !== 'string' ||
          typeof importedData.libraryTitle !== 'string' ||
          typeof importedData.customWelcomeMessage !== 'string' || // Added this based on appState
          typeof importedData.currentTheme !== 'string' ||       // Added this
          !Array.isArray(importedData.books)
        ) {
          throw new Error("Invalid library file format. The file does not contain the expected data structure (userName, libraryTitle, books array, etc.).");
        }
        
        // Further validation: ensure books have id, title, and pages array
        for (const book of importedData.books) {
            if (typeof book.id !== 'string' || typeof book.title !== 'string' || !Array.isArray(book.pages)) {
                throw new Error(`Invalid book data found in the imported file. Book title: "${book.title || 'Unknown'}" is missing required fields.`);
            }
            // Validate pages within each book
            for (const page of book.pages) {
                if (typeof page.content !== 'string' || (page.coverImageUrl !== undefined && typeof page.coverImageUrl !== 'string')) {
                     throw new Error(`Invalid page data in book "${book.title}". Page content or coverImageUrl format is incorrect.`);
                }
            }
        }


        // Ask for confirmation before overwriting existing data
        if (!confirm("Are you sure you want to import this library? This will overwrite your current library data.")) {
          event.target.value = null; // Reset file input
          console.log("Library import cancelled by user.");
          return;
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, importedDataString);
        alert("Library imported successfully! The application will now refresh to apply the changes.");
        console.log("Library imported and localStorage updated.");

        // Refresh the application UI to reflect the new data
        if (window.refreshAppUI && typeof window.refreshAppUI === "function") {
          window.refreshAppUI();
        } else {
          // Fallback if global refresh function isn't available
          alert("Please refresh the page manually to see the imported library.");
          // Consider window.location.reload(); but it's a harder refresh.
        }

      } catch (error) {
        console.error("Error processing or validating imported library file:", error);
        alert(`Failed to import library: ${error.message}. Please ensure the file is a valid library backup.`);
      } finally {
        event.target.value = null; // Reset file input regardless of success/failure to allow re-selection
      }
    };

    reader.onerror = function () {
      console.error("Error reading the selected file for import:", reader.error);
      alert("An error occurred while trying to read the selected file. Please try again.");
      event.target.value = null; // Reset file input
    };

    reader.readAsText(file);
  }

  // Initialize when the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeImportExport);
  } else {
    // DOMContentLoaded has already fired
    initializeImportExport();
  }

})(window);