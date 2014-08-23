(function() {
  var __hasProp = {}.hasOwnProperty;

  angular.module("dateRangePicker", ['pasvaz.bindonce']);

  angular.module("dateRangePicker").directive("dateRangePicker", [
    "$compile", "$timeout", function($compile, $timeout) {
      var CUSTOM, pickerTemplate;
      pickerTemplate = "<div ng-show=\"visible\" class=\"angular-date-range-picker__picker\" ng-click=\"handlePickerClick($event)\" ng-class=\"{'angular-date-range-picker--ranged': showRanged }\">\n  <div class=\"angular-date-range-picker__timesheet\">\n    <a ng-click=\"move(-1, $event)\" class=\"angular-date-range-picker__prev-month\">&#9664;</a>\n    <div bindonce ng-repeat=\"month in months\" class=\"angular-date-range-picker__month\">\n      <div class=\"angular-date-range-picker__month-name\" bo-text=\"month.name\"></div>\n      <table class=\"angular-date-range-picker__calendar\">\n        <tr>\n          <th bindonce ng-repeat=\"day in month.weeks[1]\" class=\"angular-date-range-picker__calendar-weekday\" bo-text=\"day.date.format('dd')\">\n          </th>\n        </tr>\n        <tr bindonce ng-repeat=\"week in month.weeks\">\n          <td\n              bo-class='{\n                \"angular-date-range-picker__calendar-day\": day,\n                \"angular-date-range-picker__calendar-day-selected-0\": day.selected[0],\n                \"angular-date-range-picker__calendar-day-selected-1\": day.selected[1],\n                \"angular-date-range-picker__calendar-day-disabled\": day.disabled,\n                \"angular-date-range-picker__calendar-day-start\": day.start\n              }'\n              ng-repeat=\"day in week track by $index\" ng-click=\"select(day, $event)\">\n              <div class=\"angular-date-range-picker__calendar-day-wrapper\" bo-text=\"day.date.date()\"></div>\n          </td>\n        </tr>\n      </table>\n    </div>\n    <a ng-click=\"move(+1, $event)\" class=\"angular-date-range-picker__next-month\">&#9654;</a>\n  </div>\n  <div class=\"angular-date-range-picker__panel\">\n    <div ng-show=\"showRanged\">\n      Select range: <select ng-click=\"prevent_select($event)\" ng-model=\"quick\" ng-options=\"e.range as e.label for e in quickList\"></select>\n    </div>\n    <input type=\"text\" id=\"datebox_0_start\" class=\"angular-date-range-picker__datebox\" ng-focus=\"cursel=0\" ng-blur=\"setDate($event,0,0)\" placeholder=\"YYYY-MM-DD\"/>\n    <input type=\"text\" id=\"datebox_0_end\" class=\"angular-date-range-picker__datebox\" ng-focus=\"cursel=0\" ng-blur=\"setDate($event,0,1)\" placeholder=\"YYYY-MM-DD\"/><br/>\n    <label class=\"angular-date-range-picker__comparelabel\">\n      <input type=\"checkbox\" ng-model=\"showcomp\" ng-true-value=\"1\" ng-false-value=\"0\" ng-change=\"flipCompare()\"/> Compare to...</label>\n    </label>\n    <div ng-show=\"showcomp\">\n      <input type=\"text\" id=\"datebox_1_start\" class=\"angular-date-range-picker__datebox\" ng-focus=\"cursel=1\" ng-blur=\"setDate($event,1,0)\" placeholder=\"YYYY-MM-DD\"/>\n      <input type=\"text\" id=\"datebox_1_end\" class=\"angular-date-range-picker__datebox\" ng-focus=\"cursel=1\" ng-blur=\"setDate($event,1,1)\" placeholder=\"YYYY-MM-DD\"/><br/>\n    </div>\n    <div class=\"angular-date-range-picker__buttons\">\n      <a ng-click=\"ok($event)\" class=\"angular-date-range-picker__apply\">Apply</a>\n      <a ng-click=\"hide($event)\" class=\"angular-date-range-picker__cancel\">cancel</a>\n    </div>\n  </div>\n</div>";
      CUSTOM = "CUSTOM";
      return {
        restrict: "AE",
        replace: true,
        template: "<span tabindex=\"0\" class=\"angular-date-range-picker__input\">\n  <span ng-if=\"showRanged\">\n    <span ng-show=\"model && model.0\">{{ model.0.start.format(\"ll\") }} - {{ model.0.end.format(\"ll\") }}</span>\n    <span ng-hide=\"model && model.0\">Select date range</span>\n  </span>\n  <span ng-if=\"!showRanged\">\n    <span ng-show=\"model && model.0\">{{ model.0.format(\"ll\") }}</span>\n    <span ng-hide=\"model && model.0\">Select date</span>\n  </span>\n</span>",
        scope: {
          model: "=ngModel",
          customSelectOptions: "=",
          ranged: "=",
          pastDates: "@",
          callback: "&"
        },
        link: function($scope, element, attrs) {
          var documentClickFn, domEl, _calculateRange, _checkQuickList, _getModel, _makeQuickList, _prepare;
          $scope.quickListDefinitions = $scope.customSelectOptions;
          if ($scope.quickListDefinitions == null) {
            $scope.quickListDefinitions = [
              {
                label: "This week",
                range: moment().range(moment().startOf("week").startOf("day"), moment().endOf("week").startOf("day"))
              }, {
                label: "Next week",
                range: moment().range(moment().startOf("week").add(1, "week").startOf("day"), moment().add(1, "week").endOf("week").startOf("day"))
              }, {
                label: "This fortnight",
                range: moment().range(moment().startOf("week").startOf("day"), moment().add(1, "week").endOf("week").startOf("day"))
              }, {
                label: "This month",
                range: moment().range(moment().startOf("month").startOf("day"), moment().endOf("month").startOf("day"))
              }, {
                label: "Next month",
                range: moment().range(moment().startOf("month").add(1, "month").startOf("day"), moment().add(1, "month").endOf("month").startOf("day"))
              }
            ];
          }
          $scope.quick = null;
          $scope.range = null;
          $scope.selecting = false;
          $scope.visible = false;
          $scope.start = null;
          $scope.cursel = 0;
          $scope.showcomp = false;
          $scope.selection = [];
          $scope.showRanged = $scope.ranged === void 0 ? true : $scope.ranged;
          $scope.showCompare = $scope.compare === void 0 ? true : $scope.compare;
          $scope.setDate = function(evt, selnum, isend) {
            var end, newdate, start;
            newdate = moment(evt.target.value, ['YYYY-MM-DD', 'MM/DD/YY', 'MM/DD/YYYY']);
            if (newdate.isValid()) {
              if ($scope.selection[selnum]) {
                if (isend) {
                  $scope.selection[selnum].end = newdate;
                } else {
                  $scope.selection[selnum].start = newdate;
                }
              } else {
                start = newdate.clone();
                end = newdate.clone();
                if (isend) {
                  start.add('d', -1);
                } else {
                  end.add('d', 1);
                }
                $scope.selection[selnum] = moment().range(start, end);
              }
              return _prepare();
            }
          };
          $scope.flipCompare = function() {
            return $scope.cursel = parseInt($scope.showcomp);
          };
          $scope.$watchCollection('selection', function(cur, prev, scope) {
            var i, _i, _results;
            _results = [];
            for (i = _i = 0; _i <= 1; i = ++_i) {
              if (cur && cur[i]) {
                document.getElementById("datebox_" + i + "_start").value = cur[i].start.format('YYYY-MM-DD');
                _results.push(document.getElementById("datebox_" + i + "_end").value = cur[i].end.format('YYYY-MM-DD'));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          });
          _getModel = function(index) {
            if (index == null) {
              index = 0;
            }
            if ($scope.showCompare) {
              if (!$scope.model) {
                $scope.model = [];
              }
              return $scope.model[index];
            } else {
              return $scope.model;
            }
          };
          _makeQuickList = function(includeCustom) {
            var e, _i, _len, _ref, _results;
            if (includeCustom == null) {
              includeCustom = false;
            }
            if (!$scope.showRanged) {
              return;
            }
            $scope.quickList = [];
            if (includeCustom) {
              $scope.quickList.push({
                label: "Custom",
                range: CUSTOM
              });
            }
            _ref = $scope.quickListDefinitions;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              e = _ref[_i];
              _results.push($scope.quickList.push(e));
            }
            return _results;
          };
          _calculateRange = function() {
            var end, model, start;
            if ($scope.showRanged) {
              return $scope.range = $scope.selection[$scope.cursel] ? (start = $scope.selection[$scope.cursel].start.clone().startOf("month").startOf("day"), end = start.clone().add(2, "months").endOf("month").startOf("day"), moment().range(start, end)) : moment().range(moment().startOf("month").subtract(1, "month").startOf("day"), moment().endOf("month").add(1, "month").startOf("day"));
            } else {
              model = _getModel($scope.cursel);
              $scope.selection[$scope.cursel] = false;
              $scope.selection[$scope.cursel] = model || false;
              $scope.date = moment(model) || moment();
              return $scope.range = moment().range(moment($scope.date).startOf("month"), moment($scope.date).endOf("month"));
            }
          };
          _checkQuickList = function() {
            var e, _i, _len, _ref;
            if (!$scope.showRanged) {
              return;
            }
            if (!$scope.selection[$scope.cursel]) {
              return;
            }
            _ref = $scope.quickList;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              e = _ref[_i];
              if (e.range !== CUSTOM && $scope.selection[$scope.cursel].start.startOf("day").unix() === e.range.start.startOf("day").unix() && $scope.selection[$scope.cursel].end.startOf("day").unix() === e.range.end.startOf("day").unix()) {
                $scope.quick = e.range;
                _makeQuickList();
                return;
              }
            }
            $scope.quick = CUSTOM;
            return _makeQuickList(true);
          };
          _prepare = function() {
            var m, startDay, startIndex, _i, _len, _ref;
            $scope.months = [];
            startIndex = $scope.range.start.year() * 12 + $scope.range.start.month();
            startDay = moment().startOf("week").day();
            $scope.range.by("days", function(date) {
              var cursel, d, dis, i, m, sel, w, _base, _base1, _ref;
              d = date.day() - startDay;
              if (d < 0) {
                d = 7 + d;
              }
              m = date.year() * 12 + date.month() - startIndex;
              w = parseInt((7 + date.date() - d) / 7);
              sel = [];
              dis = false;
              if ($scope.showRanged) {
                _ref = $scope.selection;
                for (i in _ref) {
                  if (!__hasProp.call(_ref, i)) continue;
                  cursel = _ref[i];
                  if ($scope.start && parseInt(i) === parseInt($scope.cursel)) {
                    sel[i] = date.isSame($scope.start);
                    dis = date < $scope.start;
                  } else {
                    sel[i] = cursel && cursel.contains(date);
                  }
                }
              } else {
                sel[0] = date.isSame($scope.selection[0]);
                if ($scope.pastDates) {
                  dis = moment().diff(date, 'days') > 0;
                }
              }
              (_base = $scope.months)[m] || (_base[m] = {
                name: date.format("MMMM YYYY"),
                weeks: []
              });
              (_base1 = $scope.months[m].weeks)[w] || (_base1[w] = []);
              return $scope.months[m].weeks[w][d] = {
                date: date,
                selected: sel,
                disabled: dis,
                start: $scope.start && $scope.start.unix() === date.unix()
              };
            });
            _ref = $scope.months;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              m = _ref[_i];
              if (!m.weeks[0]) {
                m.weeks.splice(0, 1);
              }
            }
            return _checkQuickList();
          };
          $scope.show = function() {
            var i, _i;
            for (i = _i = 0; _i <= 1; i = ++_i) {
              $scope.selection[i] = _getModel(i);
            }
            _calculateRange();
            _prepare();
            return $scope.visible = true;
          };
          $scope.hide = function($event) {
            if ($event != null) {
              if (typeof $event.stopPropagation === "function") {
                $event.stopPropagation();
              }
            }
            $scope.visible = false;
            return $scope.start = null;
          };
          $scope.prevent_select = function($event) {
            return $event != null ? typeof $event.stopPropagation === "function" ? $event.stopPropagation() : void 0 : void 0;
          };
          $scope.ok = function($event) {
            if ($event != null) {
              if (typeof $event.stopPropagation === "function") {
                $event.stopPropagation();
              }
            }
            $scope.model = $scope.model || [];
            $scope.model[0] = $scope.selection[0];
            $scope.model[1] = $scope.selection[1];
            $timeout(function() {
              if ($scope.callback) {
                return $scope.callback();
              }
            });
            return $scope.hide();
          };
          $scope.select = function(day, $event) {
            if ($event != null) {
              if (typeof $event.stopPropagation === "function") {
                $event.stopPropagation();
              }
            }
            if (day.disabled) {
              return;
            }
            if ($scope.showRanged) {
              $scope.selecting = !$scope.selecting;
              if ($scope.selecting) {
                $scope.start = day.date;
              } else {
                $scope.selection[$scope.cursel] = moment().range($scope.start, day.date);
                $scope.start = null;
              }
            } else {
              $scope.selection[$scope.cursel] = moment(day.date);
            }
            return _prepare();
          };
          $scope.move = function(n, $event) {
            if ($event != null) {
              if (typeof $event.stopPropagation === "function") {
                $event.stopPropagation();
              }
            }
            if ($scope.showRanged) {
              $scope.range = moment().range($scope.range.start.add(n, 'months').startOf("month").startOf("day"), $scope.range.start.clone().add(2, "months").endOf("month").startOf("day"));
            } else {
              $scope.date.add(n, 'months');
              $scope.range = moment().range(moment($scope.date).startOf("month"), moment($scope.date).endOf("month"));
            }
            return _prepare();
          };
          $scope.handlePickerClick = function($event) {
            return $event != null ? typeof $event.stopPropagation === "function" ? $event.stopPropagation() : void 0 : void 0;
          };
          $scope.$watch("quick", function(q, o) {
            if (!q || q === CUSTOM) {
              return;
            }
            $scope.selection[$scope.cursel] = $scope.quick;
            $scope.selecting = false;
            $scope.start = null;
            _calculateRange();
            return _prepare();
          });
          $scope.$watch("customSelectOptions", function(value) {
            if (typeof customSelectOptions === "undefined" || customSelectOptions === null) {
              return;
            }
            return $scope.quickListDefinitions = value;
          });
          domEl = $compile(angular.element(pickerTemplate))($scope);
          element.append(domEl);
          element.bind("click", function(e) {
            if (e != null) {
              if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
              }
            }
            return $scope.$apply(function() {
              if ($scope.visible) {
                return $scope.hide();
              } else {
                return $scope.show();
              }
            });
          });
          documentClickFn = function(e) {
            $scope.$apply(function() {
              return $scope.hide();
            });
            return true;
          };
          angular.element(document).bind("click", documentClickFn);
          $scope.$on('$destroy', function() {
            return angular.element(document).unbind('click', documentClickFn);
          });
          _makeQuickList();
          _calculateRange();
          return _prepare();
        }
      };
    }
  ]);

}).call(this);
