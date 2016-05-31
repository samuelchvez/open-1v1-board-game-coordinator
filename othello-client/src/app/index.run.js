(function() {
  'use strict';

  angular
    .module('othelloClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
