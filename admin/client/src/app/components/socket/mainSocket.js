(function(angular){
  'use strict';

  angular
    .module('othelloLeague')
    .factory('mainSocket', mainSocketFactory);

  mainSocketFactory.$inject = ['socketFactory'];

  function mainSocketFactory(socketFactory){

    var mainIOSocket = io.connect(
      'http://localhost:3000', {
        'sync disconnect on unload': true
      }
    );

    return socketFactory({
      ioSocket: mainIOSocket
    });
  }
})(angular);