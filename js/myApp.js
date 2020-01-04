
(function() {

const observer = new IntersectionObserver(function(entries) {
	entries.forEach(entry => {
		if (entry.intersectionRatio > 0) {
			entry.target.src = entry.target.dataset.src;
		}
	});
});


var app = angular.module('myApp', ['ngAnimate']);

app.directive('lazyLoad', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			const img = angular.element(element)[0];
			observer.observe(img);
		}
	};
});

app.factory('unitData', function($http) {
	return $http.get('data/unit_data.json');
});

app.controller('myController', function($scope,$document,$log,unitData) {
	$scope.dateString = '';
	$scope.units = [];
	$scope.tags = [];
	$scope.abilities = ['*'];
	$scope.rarity = [1,2,3,4,5,6,7,'P7',8];
	$scope.elements = ['Earth','Fire','Water','Null'];
	$scope.types = ['Flurry','Slice','Pound'];
	$scope.skill_types = ['Support','Rush','Multi','Multi&Rush','All Atks'];
	$scope.evolutions = [0,2,4];
	$scope.result = [];
	$scope.settings = {
		ability: 0,
		showImages: false,
		overlay: true,
		loaded: false,
		firstAbility: false
	};

	$scope.headers = [
		{name: 'Name', sort: 'name'},
		{name: 'Rarity', sort: 'rarity'},
		{name: 'Element', sort: 'element'},
		{name: 'Type', sort: 'type'},
		{name: 'Attack', sort: 'attack'},
		{name: 'HP', sort: 'hp'},
		{name: 'Ability', sort: 'ability[0].ind'},
		{name: ''},
		{name: 'Skill 1'},
		{name: ''},
		{name: 'Skill 2'}
	];

	$scope.sort = {
		type1: 'element',
		type2: 'name',
		reverse: false
	};

	const unit_prefix = 'http://ishtaria.wikia.com/wiki/';
	const img_prefix = 'https://vignette.wikia.nocookie.net/age-of-ishtaria/images/';
	const empty_img = 'b/b2/Empty-image.png';

	var active_tags = [];
	var active_rarity = [];
	var active_types = [];
	var active_elements = [];
	var active_skill_types = [];
	var active_evolutions = [];

	function pad(str, max) {
		return str.toString().length < max ? pad('0' + str.toString(), max) : str;
	}

	function make_obj(val,active) {
		return { 
			value: val,
			count: 0,
			active: active
		};
	}

	$scope.init = function() {
		unitData.then(response => {
			$log.log(response.status);

			if (typeof response.data !== 'undefined') {
				if (typeof response.data.units !== 'undefined') $scope.units = response.data.units;
				if (typeof response.data.tags !== 'undefined') $scope.tags = response.data.tags;
				if (typeof response.data.abilities !== 'undefined') $scope.abilities = $scope.abilities.concat(response.data.abilities);
				if (typeof response.data.timestamp !== 'undefined') {
					let tmp = new Date(response.data.timestamp);
					$scope.dateString = 'UTC  ' + pad(tmp.getUTCHours(),2) + ':' + pad(tmp.getUTCMinutes(),2) + ' - ' + pad(tmp.getUTCDate(),2) + '/' + pad(tmp.getUTCMonth()+1,2) + '/' + tmp.getUTCFullYear();
				}
			}

			$scope.abilities = $scope.abilities.map(x => make_obj(x,false));
			$scope.tags = $scope.tags.map(x => make_obj(x,false));
			$scope.skill_types = $scope.skill_types.map(x => make_obj(x,false));
			$scope.rarity = $scope.rarity.map(x => make_obj(x,false));
			$scope.elements = $scope.elements.map(x => make_obj(x,true));
			$scope.types = $scope.types.map(x => make_obj(x,true));
			$scope.evolutions = $scope.evolutions.map(x => make_obj(x,true));

			$scope.rarity[$scope.rarity.length-1].active = true;
			$scope.rarity[$scope.rarity.length-2].active = true;

			$scope.units.forEach(unit => {
				unit.src = unit_prefix + unit.name;
				unit.isrc = img_prefix + ((unit.isrc === '') ? empty_img : (unit.isrc + '/' + unit.name.split(' ').join('_') + '.png'));
			});

			$scope.search();

			$document[0].onclick = function(event) {
				let ov = $document[0].getElementsByClassName('search_overlay');
				if ($scope.settings.overlay && !ov[0].contains(event.target) && !ov[1].contains(event.target) ) {
					$scope.settings.overlay = false;
					$scope.$apply();
				}
			};

			$scope.settings.loaded = true;
		}, error => {
			$log.error(error);
		});
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
				if (ref.active) filter.act.push(index1 > 0 ? ref.value : index2);
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

			if ($scope.settings.firstAbility) $scope.abilities[unit.ability[0].ind+1].count++;
			else unit.ability.forEach(ability => { $scope.abilities[ability.ind+1].count++; });

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
			if ( (unit.skills[0].tags.indexOf(active_tags[j]) === -1) && (unit.skills[1].tags.indexOf(active_tags[j]) === -1) ) return false;
		}

		for (j=0; j<active_skill_types.length; j++) {
			if ( (unit.skills[0].type !== active_skill_types[j]) && (unit.skills[1].type !== active_skill_types[j]) ) return false;
		}

		if ($scope.settings.ability !== 0) {
			flg = false;
			if ($scope.settings.firstAbility) flg = unit.ability[0].ind+1 === $scope.settings.ability;
			else unit.ability.forEach(ability => { if (ability.ind+1 === $scope.settings.ability) flg = true; });
			if (!flg) return false;
		}

		if (active_types.indexOf(unit.type) === -1) return false;
		if (active_elements.indexOf(unit.element) === -1) return false;
		if (active_rarity.indexOf(unit.rarity) === -1) return false;
		if (active_evolutions.indexOf(unit.evolutions) === -1) return false;

		return true;
	}

	$scope.hsort = function(header) {
		if (typeof header.sort === 'undefined') return;
		if ($scope.sort.type1 === header.sort) $scope.sort.reverse = !$scope.sort.reverse;
		$scope.sort.type2 = $scope.sort.type1;
		$scope.sort.type1 = header.sort;
	};

	$scope.csort = function(val,rev) {
		$scope.sort.reverse = rev;
		$scope.sort.type2 = $scope.sort.type1;
		$scope.sort.type1 = val;
	};
});

})();
