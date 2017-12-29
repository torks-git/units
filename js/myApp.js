
var app = angular.module('myApp', []);

app.controller('myController',function($scope,$document) {
	$scope.units = [];
	$scope.tags = [];
	$scope.abilities = ["*"];
	$scope.rarity = [1,2,3,4,5,6,7];
	$scope.elements = ["Earth","Fire","Water","Null"];
	$scope.types = ["Flurry","Slice","Pound"];
	$scope.skill_types = ["Support","Rush","Multi","Multi&Rush"];
	$scope.result = [];
	$scope.overlay = true;
	$scope.ability = 0;

	$scope.headers = [
		{name: "Name", sort: "name"},
		{name: "Rarity", sort: "rarity"},
		{name: "Element", sort: "element"},
		{name: "Type", sort: "type"},
		{name: "Attack", sort: "attack"},
		{name: "HP", sort: "hp"},
		{name: "Ability", sort: "ability.ind"},
		{name: ""},
		{name: "Skill 1"},
		{name: ""},
		{name: "Skill 2"}
	];

	$scope.sortType = 'element';
	$scope.sortReverse = false;

	var active_tags = [];
	var active_rarity = [];
	var active_types = [];
	var active_elements = [];
	var active_skill_types = [];

	$scope.myinit = function() {
		var tmp;

		if (typeof aoi_data !== "undefined") {
			if (typeof aoi_data.units !== "undefined") $scope.units = aoi_data.units;
			if (typeof aoi_data.tags !== "undefined") $scope.tags = aoi_data.tags;
			if (typeof aoi_data.abilities !== "undefined") $scope.abilities = $scope.abilities.concat(aoi_data.abilities);
		}

		var scopes = [$scope.tags, $scope.skill_types, $scope.rarity, $scope.elements, $scope.types];
		for (var j=0; j<scopes.length; j++) {
			for (var i=0; i<scopes[j].length; i++) {
				tmp = scopes[j][i];
				scopes[j][i] = {
					value: tmp,
					active: (j > 2) ? true : false
				};
			}
		}

		$scope.rarity[$scope.rarity.length-1].active = true;

		//comment this to disable P7 rarity
		for (var j=0; j<$scope.units.length; j++) {
			if (is_platinum($scope.units[j])) $scope.units[j].rarity = "P" + $scope.units[j].rarity;
		}
		$scope.rarity.push({value: "P7", active: true});

		$scope.search();

		tmp = $document[0].getElementsByClassName("search_overlay")[0];
		$document[0].onclick = function (event) {
			if ($scope.overlay && !tmp.contains(event.target)) {
				$scope.overlay = false;
				$scope.$apply();
			}
		};
	};

	$scope.search = function() {
		active_tags = [];
		active_rarity = [];
		active_types = [];
		active_elements = [];
		active_skill_types = [];
		$scope.result = [];

		var filters = [
			{ref: $scope.tags, act: active_tags},
			{ref: $scope.rarity, act: active_rarity},
			{ref: $scope.elements, act: active_elements},
			{ref: $scope.types, act: active_types},
			{ref: $scope.skill_types, act: active_skill_types}
		];

		for (var j=0; j<filters.length; j++) {
			for (var i=0; i<filters[j].ref.length; i++) {
				if (filters[j].ref[i].active) {
					filters[j].act.push( j > 0 ? filters[j].ref[i].value : i);
				}
			}
		}
		
		for (var j=0; j<active_skill_types.length; j++) {
			active_skill_types[j] = active_skill_types[j].replace("&","");
		}

		for (var i=0; i<$scope.units.length; i++) {
			if(check_unit($scope.units[i])) {
				$scope.result.push($scope.units[i]);
			}
		}
	};

	function check_unit(unit) {
		for (var j=0; j<active_tags.length; j++) {
			if ( (unit.skills[0].tags.indexOf(active_tags[j]) === -1) && (unit.skills[1].tags.indexOf(active_tags[j]) === -1) ) {
				return false;
			}
		}
		
		for (var j=0; j<active_skill_types.length; j++) {
			if ( (unit.skills[0].type !== active_skill_types[j]) && (unit.skills[1].type !== active_skill_types[j]) ) {
				return false;
			}
		}

		if (($scope.ability !== 0) && (unit.ability.ind+1 !== $scope.ability)) return false;
		if (active_types.indexOf(unit.type) === -1) return false;
		if (active_elements.indexOf(unit.element) === -1) return false;
		if (active_rarity.indexOf(unit.rarity) === -1) return false;

		return true;
	}

	function is_platinum(unit) {
		return ((unit.skills[1].type === "Unique") && (unit.name !== "Trivia"));
	}
});
