# vim: set ts=2 sts=2 sw=2 :
angular.module "dateRangePicker", ['pasvaz.bindonce']

angular.module("dateRangePicker").directive "dateRangePicker", ["$compile", "$timeout", ($compile, $timeout) ->
  # constants
  pickerTemplate = """
  <div ng-show="visible" class="angular-date-range-picker__picker" ng-click="handlePickerClick($event)" ng-class="{'angular-date-range-picker--ranged': showRanged }">
    <div class="angular-date-range-picker__timesheet">
      <a ng-click="move(-1, $event)" class="angular-date-range-picker__prev-month">&#9664;</a>
      <div bindonce ng-repeat="month in months" class="angular-date-range-picker__month">
        <div class="angular-date-range-picker__month-name" bo-text="month.name"></div>
        <table class="angular-date-range-picker__calendar">
          <tr>
            <th bindonce ng-repeat="day in month.weeks[1]" class="angular-date-range-picker__calendar-weekday" bo-text="day.date.format('dd')">
            </th>
          </tr>
          <tr bindonce ng-repeat="week in month.weeks">
            <td
                bo-class='{
                  "angular-date-range-picker__calendar-day": day,
                  "angular-date-range-picker__calendar-day-selected-0": day.selected[0],
                  "angular-date-range-picker__calendar-day-selected-1": day.selected[1],
                  "angular-date-range-picker__calendar-day-disabled": day.disabled,
                  "angular-date-range-picker__calendar-day-start": day.start
                }'
                ng-repeat="day in week track by $index" ng-click="select(day, $event)">
                <div class="angular-date-range-picker__calendar-day-wrapper" bo-text="day.date.date()"></div>
            </td>
          </tr>
        </table>
      </div>
      <a ng-click="move(+1, $event)" class="angular-date-range-picker__next-month">&#9654;</a>
    </div>
    <div class="angular-date-range-picker__panel">
      <div ng-show="showRanged">
        Select range: <select ng-click="prevent_select($event)" ng-model="quick" ng-options="e.range as e.label for e in quickList"></select>
      </div>
      <input type="text" id="datebox_0_start" class="angular-date-range-picker__datebox" ng-focus="cursel=0" ng-blur="setDate($event,0,0)" placeholder="YYYY-MM-DD"/>
      <input type="text" id="datebox_0_end" class="angular-date-range-picker__datebox" ng-focus="cursel=0" ng-blur="setDate($event,0,1)" placeholder="YYYY-MM-DD"/><br/>
      <div ng-if="showCompare">
        <label class="angular-date-range-picker__comparelabel">
          <input type="checkbox" ng-model="showcomp" ng-true-value="1" ng-false-value="0" ng-change="flipCompare()"/> Compare to...</label>
        </label>
        <div ng-show="showcomp">
          <input type="text" id="datebox_1_start" class="angular-date-range-picker__datebox" ng-focus="cursel=1" ng-blur="setDate($event,1,0)" placeholder="YYYY-MM-DD"/>
          <input type="text" id="datebox_1_end" class="angular-date-range-picker__datebox" ng-focus="cursel=1" ng-blur="setDate($event,1,1)" placeholder="YYYY-MM-DD"/><br/>
        </div>
        <div class="angular-date-range-picker__buttons">
          <a ng-click="ok($event)" class="angular-date-range-picker__apply">Apply</a>
          <a ng-click="hide($event)" class="angular-date-range-picker__cancel">cancel</a>
        </div>
      </div>
    </div>
  </div>
  """
  CUSTOM = "CUSTOM"

  restrict: "AE"
  replace: true
  template: """
  <span tabindex="0" class="angular-date-range-picker__input">
    <span ng-if="showRanged">
      <span ng-show="selection && selection.0">{{ selection.0.start.format("ll") }} - {{ selection.0.end.format("ll") }}</span>
      <span ng-hide="selection && selection.0">Select date range</span>
    </span>
    <span ng-if="!showRanged">
      <span ng-show="selection && selection.0">{{ selection.0.format("ll") }}</span>
      <span ng-hide="selection && selection.0">Select date</span>
    </span>
  </span>
  """
  scope:
    model: "=ngModel" # can't use ngModelController, we need isolated scope
    customSelectOptions: "="
    ranged: "="
    compare: "="
    pastDates: "@"
    noFutureDates: "@"
    callback: "&"

  link: ($scope, element, attrs) ->
    $scope.quickListDefinitions = $scope.customSelectOptions
    $scope.quickListDefinitions ?= [
      {
        label: "This week",
        range: moment().range(
          moment().startOf("week").startOf("day"),
          moment().endOf("week").startOf("day")
        )
      }
      {
        label: "Next week",
        range: moment().range(
          moment().startOf("week").add(1, "week").startOf("day"),
          moment().add(1, "week").endOf("week").startOf("day")
        )
      }
      {
        label: "This fortnight",
        range: moment().range(
          moment().startOf("week").startOf("day"),
          moment().add(1, "week").endOf("week").startOf("day")
        )
      }
      {
        label: "This month",
        range: moment().range(
          moment().startOf("month").startOf("day"),
          moment().endOf("month").startOf("day")
        )
      }
      {
        label: "Next month",
        range: moment().range(
          moment().startOf("month").add(1, "month").startOf("day"),
          moment().add(1, "month").endOf("month").startOf("day")
        )
      }
    ]
    $scope.quick = null
    $scope.range = null
    $scope.selecting = false
    $scope.visible = false
    $scope.start = null
    $scope.cursel = 0
    $scope.showcomp = false
    $scope.selection = []
    # Backward compatibility - if $scope.ranged is not set in the html, it displays normal date range picker.
    $scope.showRanged = if $scope.ranged == undefined then true else $scope.ranged
    $scope.showCompare = if $scope.compare == undefined then true else $scope.compare

    $scope.setDate = (evt, selnum, isend) ->
      newdate = moment(evt.target.value, ['YYYY-MM-DD', 'MM/DD/YY', 'MM/DD/YYYY'])
      if newdate.isValid()
        if $scope.selection[selnum]
          if isend
            $scope.selection[selnum].end = newdate
          else
            $scope.selection[selnum].start = newdate
        else
          start = newdate.clone()
          end = newdate.clone()
          if isend then start.add('d',-1) else end.add('d',1)

          $scope.selection[selnum] = moment().range(start, end)

        _prepare()

    $scope.flipCompare = () ->
      $scope.cursel = parseInt($scope.showcomp)

    $scope.$watchCollection 'selection', (cur, prev, scope) ->
      for i in [0..1]
        if cur && cur[i]
            document.getElementById("datebox_#{i}_start").value = cur[i].start.format('YYYY-MM-DD')
            document.getElementById("datebox_#{i}_end").value = cur[i].end.format('YYYY-MM-DD')

    _getModel = (index = 0) ->
      if $scope.showCompare
        if not $scope.model
          $scope.model = []
        return $scope.model[index]
      else
        return $scope.model

    _setSelectionFromModel = () ->
      if $scope.showCompare
        $scope.selection[0] = $scope.model[0]
        $scope.selection[1] = $scope.model[1]
      else
        $scope.selection = [$scope.model]

    _setModelFromSelection = () ->
      if $scope.showCompare
        $scope.model = $scope.model || []
        $scope.model[0] = $scope.selection[0]
        $scope.model[1] = $scope.selection[1]
      else
        $scope.model = $scope.selection[0]

    _makeQuickList = (includeCustom = false) ->
      return unless $scope.showRanged
      $scope.quickList = []
      $scope.quickList.push(label: "Custom", range: CUSTOM) if includeCustom
      for e in $scope.quickListDefinitions
        $scope.quickList.push(e)

    _calculateRange = () ->
      if $scope.showRanged
        # Ensure we have the model in selection
        if !$scope.selection || !$scope.selection[0]
          _setSelectionFromModel()

        totalSelection = if $scope.showCompare && $scope.selection && $scope.selection[1]
          moment().range(
            Math.min($scope.selection[0].start, $scope.selection[1].start),
            Math.max($scope.selection[0].end, $scope.selection[1].end)
          )
        else if $scope.selection && $scope.selection[0]
          $scope.selection[0]
        else
          false

        if $scope.noFutureDates?
          $scope.range = if totalSelection
            end = totalSelection.end.clone().endOf("month").startOf("day")
            start = end.clone().subtract(2, "months").startOf("month").startOf("day")
            moment().range(start, end)
          else
            moment().range(
              moment().startOf("month").subtract(2, "month").startOf("day"),
              moment().endOf("month").startOf("day")
            )
        else
          $scope.range = if $scope.selection && $scope.selection[0]
            start = $scope.selection[0].start.clone().startOf("month").startOf("day")
            end = start.clone().add(2, "months").endOf("month").startOf("day")
            moment().range(start, end)
          else
            moment().range(
              moment().startOf("month").subtract(1, "month").startOf("day"),
              moment().endOf("month").add(1, "month").startOf("day")
            )

      else
        model = _getModel(0)
        $scope.selection[0] = false
        $scope.selection[0] = model || false
        $scope.date = moment(model) || moment()
        $scope.range = moment().range(
          moment($scope.date).startOf("month"),
          moment($scope.date).endOf("month")
        )

    _checkQuickList = () ->
      return unless $scope.showRanged
      return unless $scope.selection[$scope.cursel]
      for e in $scope.quickList
        if e.range != CUSTOM and $scope.selection[$scope.cursel].start.startOf("day").unix() == e.range.start.startOf("day").unix() and
            $scope.selection[$scope.cursel].end.startOf("day").unix() == e.range.end.startOf("day").unix()
          $scope.quick = e.range
          _makeQuickList()
          return

      $scope.quick = CUSTOM
      _makeQuickList(true)


    _prepare = () ->
      $scope.months = []
      startIndex = $scope.range.start.year()*12 + $scope.range.start.month()
      startDay = moment().startOf("week").day()

      $scope.range.by "days", (date) ->
        d = date.day() - startDay
        d = 7+d if d < 0 # (d == -1 fix for sunday)
        m = date.year()*12 + date.month() - startIndex
        w = parseInt((7 + date.date() - d) / 7)

        sel = []
        dis = false

        if $scope.showRanged
          for own i, cursel of $scope.selection
            if $scope.start && parseInt(i) == parseInt($scope.cursel) # Javascript doesn't actually have numeric keys...
              sel[i] = date.isSame($scope.start)
              dis = date < $scope.start
            else
              sel[i] = cursel && cursel.contains(date)
        else
          sel[0] = date.isSame($scope.selection[0])
          dis = moment().diff(date, 'days') > 0 if $scope.pastDates

        if $scope.noFutureDates?
          dis = dis || moment().startOf('day').diff(date, 'days') < 0

        $scope.months[m] ||= {name: date.format("MMMM YYYY"), weeks: []}
        $scope.months[m].weeks[w] ||= []
        $scope.months[m].weeks[w][d] =
          date:     date
          selected: sel
          disabled: dis
          start:    ($scope.start && $scope.start.unix() == date.unix())

      # Remove empty rows
      for m in $scope.months
        if !m.weeks[0]
          m.weeks.splice(0, 1)

      _checkQuickList()

    $scope.show = () ->
      _setSelectionFromModel()
      _calculateRange()
      _prepare()
      $scope.visible = true

    $scope.hide = ($event) ->
      $event?.stopPropagation?()
      $scope.visible = false
      $scope.start = null

    $scope.prevent_select = ($event) ->
      $event?.stopPropagation?()

    $scope.ok = ($event) ->
      $event?.stopPropagation?()
      _setModelFromSelection()
      $timeout -> $scope.callback() if $scope.callback
      $scope.hide()

    $scope.select = (day, $event) ->
      $event?.stopPropagation?()
      return if day.disabled

      if $scope.showRanged
        $scope.selecting = !$scope.selecting

        if $scope.selecting
          $scope.start = day.date
        else
          $scope.selection[$scope.cursel] = moment().range($scope.start, day.date)
          $scope.start = null
      else
        $scope.selection[$scope.cursel] = moment(day.date)

      _prepare()

    $scope.move = (n, $event) ->
      $event?.stopPropagation?()
      if $scope.showRanged
        $scope.range = moment().range(
          $scope.range.start.add(n, 'months').startOf("month").startOf("day"),
          $scope.range.start.clone().add(2, "months").endOf("month").startOf("day")
        )
      else
        $scope.date.add(n, 'months')
        $scope.range = moment().range(
          moment($scope.date).startOf("month"),
          moment($scope.date).endOf("month")
        )

      _prepare()

    $scope.handlePickerClick = ($event) ->
      $event?.stopPropagation?()

    $scope.$watch "quick", (q, o) ->
      return if !q || q == CUSTOM
      $scope.selection[$scope.cursel] = $scope.quick
      $scope.selecting = false
      $scope.start = null
      _calculateRange()
      _prepare()

    $scope.$watch "customSelectOptions", (value) ->
      return unless customSelectOptions?
      $scope.quickListDefinitions = value

    # create DOM and bind event
    domEl = $compile(angular.element(pickerTemplate))($scope)
    element.append(domEl)

    element.bind "click", (e) ->
      e?.stopPropagation?()
      $scope.$apply ->
        if $scope.visible then $scope.hide() else $scope.show()

    documentClickFn = (e) ->
      $scope.$apply -> $scope.hide()
      true

    angular.element(document).bind "click", documentClickFn

    $scope.$on '$destroy', ->
      angular.element(document).unbind 'click', documentClickFn

    _makeQuickList()
    _calculateRange()
    _prepare()
]
