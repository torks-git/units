
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

app.controller('myController', function($scope,$document) {
	$scope.units = [];
	$scope.tags = [];
	$scope.abilities = ["*"];
	$scope.rarity = [1,2,3,4,5,6,7,"P7",8];
	$scope.elements = ["Earth","Fire","Water","Null"];
	$scope.types = ["Flurry","Slice","Pound"];
	$scope.skill_types = ["Support","Rush","Multi","Multi&Rush"];
	$scope.evolutions = [0,2,4];
	$scope.result = [];
	$scope.overlay = true;
	$scope.ability = 0;
	$scope.dateString = null;

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
	$scope.sortType2 = 'element';
	$scope.sortReverse = false;

	var active_tags = [];
	var active_rarity = [];
	var active_types = [];
	var active_elements = [];
	var active_skill_types = [];
	var active_evolutions = [];
	
	function pad (str, max) {
		str = str.toString();
		return str.length < max ? pad("0" + str, max) : str;
	}

	$scope.myinit = function() {
		var tmp;

		if (typeof aoi_data !== "undefined") {
			if (typeof aoi_data.units !== "undefined") $scope.units = aoi_data.units;
			if (typeof aoi_data.tags !== "undefined") $scope.tags = aoi_data.tags;
			if (typeof aoi_data.abilities !== "undefined") $scope.abilities = $scope.abilities.concat(aoi_data.abilities);
			if (typeof aoi_data.timestamp !== "undefined") {
				tmp = new Date(aoi_data.timestamp);
				$scope.dateString = "UTC  " + pad(tmp.getUTCHours(),2) + ":" + pad(tmp.getUTCMinutes(),2) + " - " + pad(tmp.getUTCDate(),2) + "/" + pad(tmp.getUTCMonth()+1,2) + "/" + tmp.getUTCFullYear();
			}
		}

		var scopes = [$scope.abilities, $scope.tags, $scope.skill_types, $scope.rarity, $scope.elements, $scope.types, $scope.evolutions];
		for (var j=0; j<scopes.length; j++) {
			for (var i=0; i<scopes[j].length; i++) {
				tmp = scopes[j][i];
				scopes[j][i] = {
					value: tmp,
					count: 0,
					active: (j > 3) ? true : false
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

		for (var j=0; j<filters.length; j++) {
			for (var i=0; i<filters[j].ref.length; i++) {
				filters[j].ref[i].count = 0;
				if (filters[j].ref[i].active) {
					filters[j].act.push( j > 0 ? filters[j].ref[i].value : i);
				}
			}
		}

		for (var j=0; j<$scope.abilities.length; j++) {
			$scope.abilities[j].count = 0;
		}
		
		for (var j=0; j<active_skill_types.length; j++) {
			active_skill_types[j] = active_skill_types[j].replace("&","");
		}

		for (var i=0; i<$scope.units.length; i++) {
			if(check_unit($scope.units[i])) {
				$scope.result.push($scope.units[i]);
			}
		}

		for (var i=0; i<$scope.result.length; i++) {
			for (var j=0; j<$scope.result[i].skills.length; j++) {
				for (var k=0; k<$scope.result[i].skills[j].tags.length; k++) {
					$scope.tags[$scope.result[i].skills[j].tags[k]].count++;
				}
				for (var k=0; k<$scope.skill_types.length; k++) {
					if ($scope.skill_types[k].value.replace("&","") === $scope.result[i].skills[j].type) $scope.skill_types[k].count++;
				}
			}
			
			for (var j=0; j<$scope.result[i].ability.length; j++) {
				$scope.abilities[$scope.result[i].ability[j].ind+1].count++;
			}
			for (var k=0; k<$scope.rarity.length; k++) {
				if ($scope.rarity[k].value === $scope.result[i].rarity) $scope.rarity[k].count++;
			}
			for (var k=0; k<$scope.elements.length; k++) {
				if ($scope.elements[k].value === $scope.result[i].element) $scope.elements[k].count++;
			}
			for (var k=0; k<$scope.types.length; k++) {
				if ($scope.types[k].value === $scope.result[i].type) $scope.types[k].count++;
			}
			for (var k=0; k<$scope.evolutions.length; k++) {
				if ($scope.evolutions[k].value === $scope.result[i].evolutions) $scope.evolutions[k].count++;
			}
		}
		$scope.abilities[0].count=$scope.result.length;

		for (var k=0; k<$scope.rarity.length; k++) {
			if (!$scope.rarity[k].active) $scope.rarity[k].count = '-';
		}
		for (var k=0; k<$scope.elements.length; k++) {
			if (!$scope.elements[k].active) $scope.elements[k].count = '-';
		}
		for (var k=0; k<$scope.types.length; k++) {
			if (!$scope.types[k].active) $scope.types[k].count = '-';
		}
		for (var k=0; k<$scope.evolutions.length; k++) {
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
		$scope.sortType2 = $scope.sortType;
		//$scope.sortReverse = $scope.sortType === header.sort ? !$scope.sortReverse : true;
		$scope.sortType = header.sort;
	};
	
	$scope.csort = function(val,rev) {
		$scope.sortType2 = $scope.sortType;
		$scope.sortType = val;
		$scope.sortReverse = rev;
	};
});
