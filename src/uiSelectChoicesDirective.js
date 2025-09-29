uis.directive('uiSelectChoices',
  ['uiSelectConfig', 'uisRepeatParser', 'uiSelectMinErr', '$compile', '$window', '$parse', '$$uisDebounce',
  function(uiSelectConfig, RepeatParser, uiSelectMinErr, $compile, $window, $parse, $$uisDebounce) {

  return {
    restrict: 'EA',
    require: '^uiSelect',
    replace: true,
    transclude: true,
    templateUrl: function(tElement) {
      // Needed so the uiSelect can detect the transcluded content
      tElement.addClass('ui-select-choices');

      // Gets theme attribute from parent (ui-select)
      var theme = tElement.parent().attr('theme') || uiSelectConfig.theme;
      return theme + '/choices.tpl.html';
    },

    compile: function(tElement, tAttrs) {

      if (!tAttrs.repeat) throw uiSelectMinErr('repeat', "Expected 'repeat' expression.");

      // var repeat = RepeatParser.parse(attrs.repeat);
      var groupByExp = tAttrs.groupBy;
      var groupFilterExp = tAttrs.groupFilter;

      if (groupByExp) {
        var groups = tElement.querySelectorAll('.ui-select-choices-group');
        if (groups.length !== 1) throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-group but got '{0}'.", groups.length);
        groups.attr('ng-repeat', RepeatParser.getGroupNgRepeatExpression());
      }

      var parserResult = RepeatParser.parse(tAttrs.repeat);

      // If no explicit track by in repeat, allow attribute-level fallback
      var parentTrackBy = tElement.parent().attr('track-by');
      if (!parserResult.trackByExp && (tAttrs.trackBy || parentTrackBy)) {
        parserResult.trackByExp = tAttrs.trackBy || parentTrackBy;
      }

      var choices = tElement.querySelectorAll('.ui-select-choices-row');
      if (choices.length !== 1) {
        throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row but got '{0}'.", choices.length);
      }

      choices.attr('ng-repeat', parserResult.repeatExpression(groupByExp))
             .attr('ng-if', '$select.open'); //Prevent unnecessary watches when dropdown is closed


      var rowsInner = tElement.querySelectorAll('.ui-select-choices-row-inner');
      if (rowsInner.length !== 1) {
        throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row-inner but got '{0}'.", rowsInner.length);
      }
      rowsInner.attr('uis-transclude-append', ''); //Adding uisTranscludeAppend directive to row element after choices element has ngRepeat

      // If IE8 then need to target rowsInner to apply the ng-click attr as choices will not capture the event.
      var clickTarget = $window.document.addEventListener ? choices : rowsInner;
      clickTarget.attr('ng-click', '$select.select(' + parserResult.itemName + ',$select.skipFocusser,$event)');

      return function link(scope, element, attrs, $select) {


        $select.parseRepeatAttr(attrs.repeat, groupByExp, groupFilterExp); //Result ready at $select.parserResult
        // Apply track-by fallback when repeat lacks it
        if (!$select.parserResult.trackByExp) {
          var tbAttr = attrs.trackBy || $select.$element.attr('track-by');
          if (tbAttr) {
            $select.parserResult.trackByExp = tbAttr;
          }
        }
        // Expose a key function for downstream performance features
        if ($select.parserResult.trackByExp) {
          var keyGetter = $parse($select.parserResult.trackByExp);
          $select.getItemKey = function(item) {
            var locals = {};
            locals[$select.parserResult.itemName] = item;
            return keyGetter(scope, locals);
          };
        } else {
          $select.getItemKey = function(item) { return item; };
        }
        $select.disableChoiceExpression = attrs.uiDisableChoice;
        $select.onHighlightCallback = attrs.onHighlight;
        $select.minimumInputLength = parseInt(attrs.minimumInputLength) || 0;
        var parentSearchDebounce = $select.$element && $select.$element.attr('search-debounce');
        var sdValue = angular.isDefined(attrs.searchDebounce) ? attrs.searchDebounce : parentSearchDebounce;
        $select.searchDebounce = angular.isDefined(sdValue) ? parseInt(scope.$eval(sdValue)) : uiSelectConfig.searchDebounce;

        var parentVisibleLimit = $select.$element && $select.$element.attr('visible-limit');
        var vlValue = angular.isDefined(attrs.visibleLimit) ? attrs.visibleLimit : parentVisibleLimit;
        $select.visibleLimit = angular.isDefined(vlValue) ? parseInt(scope.$eval(vlValue)) : undefined;
        if (!isNaN($select.visibleLimit) && $select.visibleLimit > 0) {
          if ($select.refreshItems) { $select.refreshItems(); }
        }

        // New: limit total visible items while searching (works for grouped and ungrouped)
        var parentVisibleLimitWhenSearching = $select.$element && $select.$element.attr('visible-limit-when-searching');
        var vlwsValue = angular.isDefined(attrs.visibleLimitWhenSearching) ? attrs.visibleLimitWhenSearching : parentVisibleLimitWhenSearching;
        $select.visibleLimitWhenSearching = angular.isDefined(vlwsValue) ? parseInt(scope.$eval(vlwsValue)) : uiSelectConfig.visibleLimitWhenSearching;
        if (!isNaN($select.visibleLimitWhenSearching) && $select.visibleLimitWhenSearching > 0) {
          if ($select.refreshItems) { $select.refreshItems(); }
        }
        $select.dropdownPosition = attrs.position ? attrs.position.toLowerCase() : uiSelectConfig.dropdownPosition;

        var lastSearch;
        var onSearchChanged = function() {
          var newValue = $select.search;
          // Reset current caps when search text changes
          if (newValue !== lastSearch) {
            $select._currentVisibleLimitWhenSearching = $select.visibleLimitWhenSearching;
            $select._groupCurrentVisibleLimit = {};
            lastSearch = newValue;
          }
          if(newValue && !$select.open && $select.multiple) $select.activate(false, true);
          $select.activeIndex = $select.tagging.isActivated ? -1 : 0;
          if (!attrs.minimumInputLength || $select.search.length >= attrs.minimumInputLength) {
            $select.refresh(attrs.refresh);
          } else {
            $select.items = [];
          }
        };

        if ($select.searchDebounce && $select.searchDebounce > 0) {
          var debounced = $$uisDebounce(function() {
            scope.$evalAsync(onSearchChanged);
          }, $select.searchDebounce);
          scope.$watch('$select.search', function() { debounced(); });
        } else {
          scope.$watch('$select.search', function() { onSearchChanged(); });
        }

        attrs.$observe('refreshDelay', function() {
          // $eval() is needed otherwise we get a string instead of a number
          var refreshDelay = scope.$eval(attrs.refreshDelay);
          $select.refreshDelay = refreshDelay !== undefined ? refreshDelay : uiSelectConfig.refreshDelay;
        });

        // Optional: step for show-more while searching (global)
        var parentVlwsStep = $select.$element && $select.$element.attr('visible-limit-when-searching-step');
        var vlwsStepValue = angular.isDefined(attrs.visibleLimitWhenSearchingStep) ? attrs.visibleLimitWhenSearchingStep : parentVlwsStep;
        var stepDefault = uiSelectConfig.visibleLimitWhenSearchingStep;
        $select.visibleLimitWhenSearchingStep = angular.isDefined(vlwsStepValue) ? parseInt(scope.$eval(vlwsStepValue)) : stepDefault;

        // Expose a helper to increase current global cap when searching
        $select.showMore = function(step) {
          var inc = angular.isNumber(step) ? step : $select.visibleLimitWhenSearchingStep;
          var base = angular.isNumber($select._currentVisibleLimitWhenSearching) ? $select._currentVisibleLimitWhenSearching : ($select.visibleLimitWhenSearching || 0);
          $select._currentVisibleLimitWhenSearching = base + inc;
          if ($select.refreshItems) { $select.refreshItems(); }
        };

        // Per-group variant: parse limits and step
        var parentGroupVl = $select.$element && $select.$element.attr('group-visible-limit-when-searching');
        var groupVlValue = angular.isDefined(attrs.groupVisibleLimitWhenSearching) ? attrs.groupVisibleLimitWhenSearching : parentGroupVl;
        $select.groupVisibleLimitWhenSearching = angular.isDefined(groupVlValue) ? parseInt(scope.$eval(groupVlValue)) : uiSelectConfig.groupVisibleLimitWhenSearching;

        var parentGroupStep = $select.$element && $select.$element.attr('group-visible-limit-when-searching-step');
        var groupStepValue = angular.isDefined(attrs.groupVisibleLimitWhenSearchingStep) ? attrs.groupVisibleLimitWhenSearchingStep : parentGroupStep;
        var groupStepDefault = uiSelectConfig.groupVisibleLimitWhenSearchingStep;
        $select.groupVisibleLimitWhenSearchingStep = angular.isDefined(groupStepValue) ? parseInt(scope.$eval(groupStepValue)) : groupStepDefault;

        // Map of per-group current limits (by group name)
        $select._groupCurrentVisibleLimit = {};

        // Expose per-group show more
        $select.showMoreGroup = function(groupName, step) {
          if (!groupName) return;
          var inc = angular.isNumber(step) ? step : $select.groupVisibleLimitWhenSearchingStep;
          var curr = $select._groupCurrentVisibleLimit[groupName];
          if (!angular.isNumber(curr)) {
            curr = angular.isNumber($select.groupVisibleLimitWhenSearching) ? $select.groupVisibleLimitWhenSearching : 0;
          }
          $select._groupCurrentVisibleLimit[groupName] = curr + inc;
          if ($select.refreshItems) { $select.refreshItems(); }
        };

        scope.$watch('$select.open', function(open) {
          if (open) {
            tElement.attr('role', 'listbox');
            $select.refresh(attrs.refresh);
          } else {
            element.removeAttr('role');
          }
        });
      };
    }
  };
}]);
