
const observer = new IntersectionObserver(function(entries) {
	entries.forEach(entry => {
		if(entry.intersectionRatio > 0){
			entry.target.src = entry.target.dataset.src;
		}
	});
});

var app = angular.module('myApp', []);

app.directive('lazyLoad', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			const img = angular.element(element)[0];
			observer.observe(img);
		}
	};
});

app.factory('myData', function($http) { 
	return $http.get('data/unit_data.json');
});

app.controller('myController', function($scope,$document,myData) {
	$scope.units = [];
	$scope.tags = [];
	$scope.abilities = ["*"];
	$scope.rarity = [1,2,3,4,5,6,7,"P7",8];
	$scope.elements = ["Earth","Fire","Water","Null"];
	$scope.types = ["Flurry","Slice","Pound"];
	$scope.skill_types = ["Support","Rush","Multi","MultiRush"];
	$scope.evolutions = [0,2,4];
	$scope.ability = 0;
	$scope.result = [];
	$scope.overlay = true;
	$scope.dateString = null;

	$scope.headers = [
		{name: "Name", sort: "name"},
		{name: "Rarity", sort: "rarity"},
		{name: "Element", sort: "element"},
		{name: "Type", sort: "type"},
		{name: "Attack", sort: "attack"},
		{name: "HP", sort: "hp"},
		{name: "Ability", sort: "ability[0].ind"},
		{name: ""},
		{name: "Skill 1"},
		{name: ""},
		{name: "Skill 2"}
	];

	$scope.sortType = 'element';
	$scope.sortType2 = 'element';
	$scope.sortReverse = false;

	var active_tags = [];
	var active_rarity = [];
	var active_types = [];
	var active_elements = [];
	var active_skill_types = [];
	var active_evolutions = [];

	function pad(str, max) {
		str = str.toString();
		return str.length < max ? pad("0" + str, max) : str;
	}

	function reset_scope() {
		$scope.rarity = [1,2,3,4,5,6,7,"P7",8];
		$scope.elements = ["Earth","Fire","Water","Null"];
		$scope.types = ["Flurry","Slice","Pound"];
		$scope.skill_types = ["Support","Rush","Multi","MultiRush"];
		$scope.evolutions = [0,2,4];
		$scope.ability = 0;
		$scope.result = [];
		$scope.overlay = true;

		$scope.sortType = 'element';
		$scope.sortType2 = 'element';
		$scope.sortReverse = false;

		var tmp,i,j;

		var scopes = [$scope.abilities, $scope.tags, $scope.skill_types, $scope.rarity, $scope.elements, $scope.types, $scope.evolutions];
		for (i=0; i<scopes.length; i++) {
			for (j=0; j<scopes[i].length; j++) {
				tmp = scopes[i][j];
				scopes[i][j] = {
					value: tmp,
					count: 0,
					active: (i > 3) ? true : false
				};
			}
		}

		$scope.rarity[$scope.rarity.length-1].active = true;
		$scope.rarity[$scope.rarity.length-2].active = true;

		$scope.units.forEach(unit => {
			unit.isrc = "https://vignette.wikia.nocookie.net/age-of-ishtaria/images/" + ((unit.isrc === "") ? "b/b2/Empty-image.png" : unit.isrc + "/" + unit.name.split(' ').join('_') + ".png");
			if (is_platinum(unit)) unit.rarity = "P" + unit.rarity;
		});

		$scope.search();
	}

	myData.then(function(response) {
		test = response;
		console.log("data have been loaded");
		
		if (typeof response.data === "object") {
			if (typeof response.data.units !== "undefined") $scope.units = response.data.units;
			if (typeof response.data.tags !== "undefined") $scope.tags = response.data.tags;
			if (typeof response.data.abilities !== "undefined") $scope.abilities = ["*"].concat(response.data.abilities);
			if (typeof response.data.timestamp !== "undefined") {
				tmp = new Date(response.data.timestamp);
				$scope.dateString = "UTC  " + pad(tmp.getUTCHours(),2) + ":" + pad(tmp.getUTCMinutes(),2) + " - " + pad(tmp.getUTCDate(),2) + "/" + pad(tmp.getUTCMonth()+1,2) + "/" + tmp.getUTCFullYear();
			}
			reset_scope();
		}
	});

	$scope.myinit = function() {
		reset_scope();

		var tmp = $document[0].getElementsByClassName("search_overlay")[0];
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
		active_evolutions = [];
		$scope.result = [];

		var filters = [
			{ref: $scope.tags, act: active_tags},
			{ref: $scope.rarity, act: active_rarity},
			{ref: $scope.elements, act: active_elements},
			{ref: $scope.types, act: active_types},
			{ref: $scope.skill_types, act: active_skill_types},
			{ref: $scope.evolutions, act: active_evolutions}
		];

		var i,j,k;

		for (i=0; i<filters.length; i++) {
			for (j=0; j<filters[i].ref.length; j++) {
				filters[i].ref[j].count = 0;
				if (filters[i].ref[j].active) {
					filters[i].act.push( i > 0 ? filters[i].ref[j].value : j);
				}
			}
		}

		for (i=0; i<$scope.abilities.length; i++) {
			$scope.abilities[i].count = 0;
		}

		for (i=0; i<$scope.units.length; i++) {
			if(check_unit($scope.units[i])) {
				$scope.result.push($scope.units[i]);
			}
		}

		for (i=0; i<$scope.result.length; i++) {
			for (j=0; j<$scope.result[i].skills.length; j++) {
				for (k=0; k<$scope.result[i].skills[j].tags.length; k++) {
					$scope.tags[$scope.result[i].skills[j].tags[k]].count++;
				}
				for (k=0; k<$scope.skill_types.length; k++) {
					if ($scope.skill_types[k].value === $scope.result[i].skills[j].type) $scope.skill_types[k].count++;
				}
			}

			for (j=0; j<$scope.result[i].ability.length; j++) {
				$scope.abilities[$scope.result[i].ability[j].ind+1].count++;
			}
			for (k=0; k<$scope.rarity.length; k++) {
				if ($scope.rarity[k].value === $scope.result[i].rarity) $scope.rarity[k].count++;
			}
			for (k=0; k<$scope.elements.length; k++) {
				if ($scope.elements[k].value === $scope.result[i].element) $scope.elements[k].count++;
			}
			for (k=0; k<$scope.types.length; k++) {
				if ($scope.types[k].value === $scope.result[i].type) $scope.types[k].count++;
			}
			for (k=0; k<$scope.evolutions.length; k++) {
				if ($scope.evolutions[k].value === $scope.result[i].evolutions) $scope.evolutions[k].count++;
			}
		}
		$scope.abilities[0].count=$scope.result.length;

		for (k=0; k<$scope.rarity.length; k++) {
			if (!$scope.rarity[k].active) $scope.rarity[k].count = '-';
		}
		for (k=0; k<$scope.elements.length; k++) {
			if (!$scope.elements[k].active) $scope.elements[k].count = '-';
		}
		for (k=0; k<$scope.types.length; k++) {
			if (!$scope.types[k].active) $scope.types[k].count = '-';
		}
		for (k=0; k<$scope.evolutions.length; k++) {
			if (!$scope.evolutions[k].active) $scope.evolutions[k].count = '-';
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

		if ($scope.ability !== 0) {
			var f = false;
			for (var j=0; j<unit.ability.length; j++) {
				if (unit.ability[j].ind+1 === $scope.ability) {
					f = true;
				}
			}
			if (!f) return false;
		}

		if (active_types.indexOf(unit.type) === -1) return false;
		if (active_elements.indexOf(unit.element) === -1) return false;
		if (active_rarity.indexOf(unit.rarity) === -1) return false;
		if (active_evolutions.indexOf(unit.evolutions) === -1) return false;

		return true;
	}

	function is_platinum(unit) {
		return (((unit.skills[0].type === "Unique") || (unit.skills[1].type === "Unique")) && (unit.name !== "Trivia"));
	}

	$scope.hsort = function(header) {
		if (typeof header.sort === "undefined") return;
		if ($scope.sortType === header.sort) $scope.sortReverse = !$scope.sortReverse;
		$scope.sortType2 = $scope.sortType;
		$scope.sortType = header.sort;
	};

	$scope.csort = function(val,rev) {
		$scope.sortReverse = rev;
		$scope.sortType2 = $scope.sortType;
		$scope.sortType = val;
	};
});
