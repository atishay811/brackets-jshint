/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, PathUtils, JSHINT */

define(function (require, exports, module) {
    'use strict';

    var Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        Menus                   = brackets.getModule("command/Menus"),
        NativeFileSystem        = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        FileUtils               = brackets.getModule("file/FileUtils"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        Resizer                 = brackets.getModule("utils/Resizer"),

        //current module's directory
        moduleDir               = FileUtils.getNativeModuleDirectoryPath(module),
        configFile              = new NativeFileSystem.FileEntry(moduleDir + '/config.js'),
        config                  = { options: {}, globals: {} },
        _command,
        _preferences,
        handleShowJSHint,
        defaultPreferences      = { checked: false },
        preferencesId           = "jshint.run.pref";

    require("jshint/jshint");

    //commands
    var commandId = "jshint.run";

    function _handleHint() {
        var currentDoc = DocumentManager.getCurrentDocument();
        var ext = currentDoc ? PathUtils.filenameExtension(currentDoc.file.fullPath) : "";
        if (!/^\.js$/i.test(ext)) {
            $("#jshint").hide();
            EditorManager.resizeEditor();
            return;
        } else {
            $("#jshint").show();
            EditorManager.resizeEditor();
        }
        var messages, result;

        var editor = EditorManager.getCurrentFullEditor();
        if (!editor) {
            $("#jshint").hide();
            EditorManager.resizeEditor();
            return;
        }
        var text = editor.document.getText();

        result = JSHINT(text, config.options, config.globals);

        if (!result) {
            var errors = JSHINT.errors;

            var $jshintTable = $("<table class='zebra-striped condensed-table' style='table-layout: fixed; width: 100%'>").append("<tbody>");
            $("<tr><th>Line</th><th>Declaration</th><th>Message</th></tr>").appendTo($jshintTable);

            var $selectedRow;

            errors.forEach(function (item) {
                var makeCell = function (content) {
                    return $("<td style='word-wrap: break-word'/>").text(content);
                };

                /*
                if item is null, it means a fatal error, for now, not going to say anything about it.
                */
                if (item) {

                    if (!item.line) { item.line = ""; }
                    if (!item.evidence) { item.evidence = ""; }

                    var $row = $("<tr/>")
                                .append(makeCell(item.line))
                                .append(makeCell(item.evidence))
                                .append(makeCell(item.reason))
                                .appendTo($jshintTable);

                    $row.click(function () {
                        if ($selectedRow) {
                            $selectedRow.removeClass("selected");
                        }
                        $row.addClass("selected");
                        $selectedRow = $row;

                        var editor = EditorManager.getCurrentFullEditor();
                        editor.setCursorPos(item.line - 1, item.col - 1);
                        EditorManager.focusEditor();
                    });

                }

            });

            $("#jshint .table-container")
                .empty()
                .append($jshintTable);

        } else {
            //todo - tell the user no issues
            $("#jshint .resizable-content")
                .empty();
            $("#jshint").hide();
            EditorManager.resizeEditor();
        }

    }

    handleShowJSHint = function () {
        console.log("JSHINTHANDLE");
        var $jshint = $("#jshint");

        if (_preferences.getValue("checked")) {
            _handleHint();
            $(DocumentManager).on("currentDocumentChange documentSaved", _handleHint);
        } else {
            $jshint.hide();
            $(DocumentManager).off("currentDocumentChange documentSaved", null,  _handleHint);
            EditorManager.resizeEditor();
        }
    };

    function loadUI() {
         //add the HTML UI
        var content =
            '  <div id="jshint" class="bottom-panel">'
            + '  <div class="toolbar simple-toolbar-layout">'
            + '    <div class="title">JSHint</div><a href="#" class="close">&times;</a>'
            + '  </div>'
            + '  <div class="table-container"/>'
            + '</div>';

        $(content).insertBefore("#status-bar");

        $('#jshint').hide();

        $('#jshint .close').click(function () {
            _command.setChecked(false);
        });

        // AppInit.htmlReady() has already executed before extensions are loaded
        // so, for now, we need to call this ourself
        Resizer.makeResizable($('#jshint').get(0), "vert", "top", 200);
    }

    function loadPreferences() {
        _preferences = PreferencesManager.getPreferenceStorage(preferencesId, defaultPreferences);
    }

    function onCheckedStateChange() {
        _preferences.setValue("checked", Boolean(_command.getChecked()));
        handleShowJSHint();
    }

    function onCommandExecuted() {
        console.log("execute Command");
        if (!_command.getChecked()) {
            _command.setChecked(true);
        } else {
            _command.setChecked(false);
        }
    }

    function loadCommand() {
        _command = CommandManager.get(
        );

        if (!_command) {
            _command = CommandManager.register("Enable JSHint", commandId, onCommandExecuted);
        } else {
            _command._commandFn = onCommandExecuted;
        }

        $(_command).on("checkedStateChange", onCheckedStateChange);
        // Apply preferences
        _command.setChecked(_preferences.getValue("checked"));
    }

    function loadMenuItem() {
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(commandId, "");
    }


    function init() {
        loadUI();
        loadPreferences();
        loadCommand();
        loadMenuItem();
        handleShowJSHint();
    }

    function showJSHintConfigError() {
        Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            "JSHINT error",
            "Unable to parse config file"
        );
    }

    FileUtils.readAsText(configFile)
    .done(function (text, readTimestamp) {

        //try to parse the config file
        try {
            config = JSON.parse(text);
        } catch (e) {
            console.log("Can't parse config file - " + e);
            showJSHintConfigError();
        }
    })
    .fail(function (error) {
        showJSHintConfigError();
    })
    .then(init);

});
