# AngularJS ui-select [![Build Status](https://travis-ci.org/angular-ui/ui-select.svg?branch=master)](https://travis-ci.org/angular-ui/ui-select) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/angular-ui/ui-select?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)


AngularJS-native version of [Select2](http://ivaynberg.github.io/select2/) and [Selectize](http://brianreavis.github.io/selectize.js/). [http://angular-ui.github.io/ui-select/](http://angular-ui.github.io/ui-select/)

[Getting Started](https://github.com/angular-ui/ui-select/wiki/Getting-Started) 

- [Examples](http://angular-ui.github.io/ui-select/#examples)
- [Examples Source](./docs/examples)
- [Documentation](https://github.com/angular-ui/ui-select/wiki)

## Latest Changes

- Check [CHANGELOG.md](/CHANGELOG.md)

## Features

- Search, Select, Multi-select and Tagging
- Multiple Themes: Bootstrap, Select2 and Selectize
- Keyboard support
- No jQuery required (except for old browsers)
- Small code base: 4.57KB min/gzipped vs 20KB for select2

For the roadmap, check [issue #3](https://github.com/angular-ui/ui-select/issues/3) and the [Wiki page](https://github.com/angular-ui/ui-select/wiki/Roadmap).

## Installation Methods

### npm
```
$ npm install ui-select
```
### bower
```
$ bower install angular-ui-select
```

## Development

### Prepare your environment
* Install [Node.js](http://nodejs.org/) and NPM (should come with)
* Install global dev dependencies: `npm install -g gulp`
* Install local dev dependencies: `npm install` in repository directory

### Development Commands

* `gulp` to jshint, build and test
* `gulp build` to jshint and build
* `gulp test` for one-time test with karma (also build and jshint)
* `gulp watch` to watch src files to jshint, build and test when changed
* `gulp docs` build docs and examples

### Benchmarks

Lightweight performance probes are included to track trends during optimization:
- Run: `npm run bench`
- Details: see PERF_BENCHMARKS.md for what is measured and how to adjust scale.

### Performance Options (opt-in)

- `track-by` (on `<ui-select>` or `<ui-select-choices>`): fallback key expression when the repeat lacks `track by ...`. Example: `track-by="person.id"`.
- `search-debounce`: debounce local search refresh in ms (e.g., `search-debounce="150"`).
- `visible-limit`: cap rendered items for ungrouped lists (e.g., `visible-limit="200"`).
- `visible-limit-when-searching`: cap total rendered items only while searching (preserves full list on open). Works for grouped and ungrouped.
  - Pair with `visible-limit-when-searching-step` to enable a global "Show more" button via `$select.showMore()` in a footer.
- `group-visible-limit-when-searching`: cap items per group only while searching (preserves full list on open). Shows a per‑group "Show more" link in built‑in themes.
  - Pair with `group-visible-limit-when-searching-step` to control per‑group increment.

Notes
- If `repeat` already includes `track by`, it takes precedence over the `track-by` attribute.
- When `track-by` is present, disabled state checks leverage O(1) key lookups; behavior is preserved otherwise.

#### Examples

Global cap while searching (with Show more)

```
<ui-select ng-model="vm.sel" theme="bootstrap"
           visible-limit-when-searching="200"
           visible-limit-when-searching-step="200">
  <ui-select-match placeholder="Pick...">{{$select.selected.name}}</ui-select-match>
  <ui-select-choices repeat="item in vm.items | filter:$select.search track by item.id">
    <div ng-bind-html="item.name | highlight:$select.search"></div>
    <ui-select-footer ng-if="$select.truncatedWhileSearching">
      <button type="button" class="btn btn-link btn-sm"
              ng-click="$select.showMore()">
        Show more ({{$select.remainingCountWhenSearching}})
      </button>
    </ui-select-footer>
  </ui-select-choices>
  </ui-select>
```

Per‑group cap while searching (built‑in per‑group Show more)

```
<ui-select ng-model="vm.sel" theme="bootstrap"
           group-visible-limit-when-searching="20"
           group-visible-limit-when-searching-step="20">
  <ui-select-match placeholder="Pick...">{{$select.selected.name}}</ui-select-match>
  <ui-select-choices repeat="item in vm.items | filter:$select.search track by item.id"
                     group-by="'category'">
    <div ng-bind-html="item.name | highlight:$select.search"></div>
  </ui-select-choices>
</ui-select>
```

Built‑in themes (Bootstrap, Select2, Selectize) render a per‑group "Show more (N)" link automatically when searching and the group is truncated. For custom themes, you can call `$select.showMoreGroup($group.name)` in your group template.

### Global Config (uiSelectConfig)

You can set sensible defaults in a config block:

```
angular.module('app').config(function(uiSelectConfig) {
  // Theme
  uiSelectConfig.theme = 'bootstrap';

  // Search-time caps
  uiSelectConfig.visibleLimitWhenSearching = undefined; // e.g., 200 for global cap
  uiSelectConfig.visibleLimitWhenSearchingStep = 100;   // global Show more step
  uiSelectConfig.groupVisibleLimitWhenSearching = undefined; // e.g., 20 per group
  uiSelectConfig.groupVisibleLimitWhenSearchingStep = 50;     // per-group Show more step

  // Existing options (unchanged)
  uiSelectConfig.searchDebounce = 150; // example
});
```

## Contributing

- Check [CONTRIBUTING.md](/CONTRIBUTING.md)
- Run the tests
- Try the [examples](./docs/examples)

When issuing a pull request, please exclude changes from the "dist" folder to avoid merge conflicts.
