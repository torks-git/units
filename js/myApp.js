
const observer = new IntersectionObserver(function(entries) {
	entries.forEach(entry => {
		if (entry.intersectionRatio > 0) {
			entry.target.src = entry.target.dataset.src;
		}
	});
});


var app = angular.module('myApp', []);

app.directive('lazyLoad', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
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
	$scope.skill_types = ["Support","Rush","Multi","MultiRush"];
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

	function pad (str, max) {
		str = str.toString();
		return str.length < max ? pad("0" + str, max) : str;
	}

	$scope.myinit = function() {
		var tmp,i,j;

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
		for (i=0; i<scopes.length; i++) {
			for (j=0; j<scopes[i].length; j++) {
				scopes[i][j] = {
					value: scopes[i][j],
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

		filters.forEach((filter,index1) => {
			filter.ref.forEach((ref,index2) => {
				ref.count = 0;
				if (ref.active) {
					filter.act.push( index1 > 0 ? ref.value : index2);
				}
			});
		});

		$scope.abilities.forEach(ability => ability.count = 0);

		$scope.result = $scope.units.filter(unit => check_unit(unit));

		$scope.result.forEach(unit => {
			unit.skills.forEach(skill => {
				skill.tags.forEach(tag => {
					$scope.tags[tag].count++;
				});
				$scope.skill_types.forEach(skill_type => { if (skill_type.value === skill.type) skill_type.count++; });
			});

			unit.ability.forEach(ability => { $scope.abilities[ability.ind+1].count++; });

			$scope.rarity.forEach(rarity => { if (rarity.value === unit.rarity) rarity.count++; });
			$scope.elements.forEach(element => { if (element.value === unit.element) element.count++; });
			$scope.types.forEach(type => { if (type.value === unit.type) type.count++; });
			$scope.evolutions.forEach(evolution => { if (evolution.value === unit.evolutions) evolution.count++; });
		});

		$scope.abilities[0].count = $scope.result.length;

		$scope.rarity.forEach(rarity => { if (!rarity.active) rarity.count = '-'; });
		$scope.elements.forEach(element => { if (!element.active) element.count = '-'; });
		$scope.types.forEach(type => { if (!type.active) type.count = '-'; });
		$scope.evolutions.forEach(evolution => { if (!evolution.active) evolution.count = '-'; });
	};

	function check_unit(unit) {
		var j,flg;

		for (j=0; j<active_tags.length; j++) {
			if ( (unit.skills[0].tags.indexOf(active_tags[j]) === -1) && (unit.skills[1].tags.indexOf(active_tags[j]) === -1) ) {
				return false;
			}
		}

		for (j=0; j<active_skill_types.length; j++) {
			if ( (unit.skills[0].type !== active_skill_types[j]) && (unit.skills[1].type !== active_skill_types[j]) ) {
				return false;
			}
		}

		if ($scope.ability !== 0) {
			flg = false;
			unit.ability.forEach(ability => { if (ability.ind+1 === $scope.ability) flg = true; });
			if (!flg) return false;
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
