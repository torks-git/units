
var app = angular.module('myApp', []);

app.controller('myController',function($scope,$document) {
	$scope.units = [];
	$scope.tags = [];
	$scope.abilities = ["*"];
	$scope.rarity = [1,2,3,4,5,6,7];
	$scope.elements = ["Earth","Fire","Water","Null"];
	$scope.types = ["Flurry","Slice","Pound"];
	$scope.result = [];
	$scope.overlay = true;
	$scope.ability = "*";

	$scope.sortType = 'element';
	$scope.sortReverse = false;
	
	$scope.myinit = function() {
		var tmp;
		
		if (typeof aoi_units !== "undefined") {
			$scope.units = aoi_units;
		}
		
		for (var i=0; i<$scope.units.length; i++) {
			for (var j=0; j<$scope.units[i].skills.length; j++) {
				$scope.units[i].skills[j].text = $scope.units[i].skills[j].text.split("<br>").join("\n");
				for (var k=0; k<$scope.units[i].skills[j].tags.length; k++) {
					tmp = $scope.units[i].skills[j].tags[k].toLowerCase();
					if ($scope.tags.indexOf(tmp) === -1) {
						$scope.tags.push(tmp);
					}
					$scope.units[i].skills[j].tags[k] = tmp;
				}
			}
			tmp = $scope.units[i].ability.replace(/ I+/,"");
			if (($scope.abilities.indexOf(tmp) === -1) && (tmp !== "-") && (tmp !== "---") && (tmp !== "")) {
				$scope.abilities.push(tmp);
			}
			
			$scope.units[i].element_style = {
				"height" : "38px",
				"background": "url(icons/"+$scope.units[i].element+".png) no-repeat center center"
			};
			$scope.units[i].type_style = {
				"height" : "38px",
				"background": "url(icons/"+$scope.units[i].type+"_icon.png) no-repeat center center"
			};
		}
		
		$scope.tags.sort();
		$scope.abilities.sort();
		
		var scopes = [$scope.tags, $scope.rarity, $scope.elements, $scope.types, $scope.abilities];
		for (var j=0;j<scopes.length;j++) {
			for (var i=0; i<scopes[j].length; i++) {
				tmp = scopes[j][i];
				scopes[j][i] = {
					value : tmp,
					active : (j > 1) ? true : false
				};
			}
		}
		
		$scope.rarity[$scope.rarity.length-1].active = true;
		
		$scope.search();
		
		tmp = $document[0].getElementsByClassName("search_overlay")[0];
		
		$document[0].onclick = function (event) {
			if ($scope.overlay) {
				if (!tmp.contains(event.target)) {
					$scope.overlay = false;
					$scope.$apply();
				}
			}
		};
	};
	
	$scope.search = function() {
		var active_tags = [];
		var active_rarity = [];
		var active_types = [];
		var active_elements = [];
		
		$scope.result = [];
		
		var actives = [active_tags, active_rarity, active_elements, active_types];
		var scopes = [$scope.tags, $scope.rarity, $scope.elements, $scope.types];
		
		for (var j=0;j<scopes.length;j++) {
			for (var i=0; i<scopes[j].length; i++) {
				if (scopes[j][i].active) {
					actives[j].push(scopes[j][i].value);
				}
			}
		}
		
		for (var i=0; i<$scope.units.length; i++) {
			if(check_unit($scope.units[i],active_tags, active_rarity, active_elements, active_types)) {
				$scope.result.push($scope.units[i]);
			}
		}
	};
	
	function check_unit(unit, active_tags, active_rarity, active_elements, active_types) {
		for (var j=0; j<active_tags.length; j++) {
			if ( (unit.skills[0].tags.indexOf(active_tags[j]) === -1) && (unit.skills[1].tags.indexOf(active_tags[j]) === -1) ) {
				return false;
			}
		}
		
		if (($scope.ability !== "*") && (unit.ability.replace(/ I+/,"") !== $scope.ability)) return false;
		if (active_rarity.indexOf(unit.rarity) === -1) return false;
		if (active_types.indexOf(unit.type) === -1) return false;
		if (active_elements.indexOf(unit.element) === -1) return false;
		
		return true;
	}
});