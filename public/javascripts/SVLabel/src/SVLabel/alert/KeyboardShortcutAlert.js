function KeyboardShortcutAlert(alertHandler) {
    var self = {
        'clickCount': {}
    };
    var MINIMUM_CLICKS_BEFORE_ALERT = 5;

    function modeSwitchButtonClicked(labelType) {
        if(labelType == 'Walk')
            return;

        if (labelType in self['clickCount'])
            self['clickCount'][labelType]++;
        else
            self['clickCount'][labelType] = 1;
        if(self['clickCount'][labelType] >= MINIMUM_CLICKS_BEFORE_ALERT) {
            var labelDescription = util.misc.getLabelDescriptions(labelType);
            if ('text' in labelDescription && 'shortcut' in labelDescription) {
                var labelText = util.misc.getLabelDescriptions(labelType)['text'];
                var labelKeyboardChar = util.misc.getLabelDescriptions(labelType)['shortcut']['keyChar'];

                alertHandler.showAlert('You can also press <kbd>'+ labelKeyboardChar +'</kbd> for choosing the "' +
                    labelText + '" label.', labelType, true);
                self['clickCount'][labelType] = 0;
            }
        }
    }

    self.modeSwitchButtonClicked = modeSwitchButtonClicked;
    return self;
}