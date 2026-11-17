// in this file you can append custom step methods to 'I' object
import { actor } from 'codeceptjs';
import assert from 'node:assert/strict';

export default function() {
  return actor({
    seeResponseCodeIs(actualStatus, expectedStatus) {
      assert.equal(
        actualStatus,
        expectedStatus,
        `Kỳ vọng mã HTTP ${expectedStatus}, nhưng nhận được ${actualStatus}`,
      );
    },
  });
}
