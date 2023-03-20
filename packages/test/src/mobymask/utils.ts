import { ethers } from 'ethers';
import _ from 'lodash';
import assert from 'assert';

import { abi as PhisherRegistryABI } from './artifacts/abi.json';

export const MOBYMASK_MESSAGE_KINDS = {
  INVOKE: 'invoke',
  REVOKE: 'revoke'
};

const contractInterface = new ethers.utils.Interface(PhisherRegistryABI);

export const getSignedDelegationFromInvite = (inviteLink: string): any => {
  const inviteLinkWithoutHash = inviteLink.split('#').join('');

  const inviteURL = new URL(inviteLinkWithoutHash);
  const invitationString = inviteURL.searchParams.get('invitation');
  assert(invitationString != null, `invitationString: ${invitationString}`);

  const { signedDelegations } = JSON.parse(invitationString);
  return signedDelegations[signedDelegations.length - 1];
};

export const checkMobyMaskMessage = (kind: string, actualData: any, expectedData: any): boolean => {
  switch (kind) {
    case MOBYMASK_MESSAGE_KINDS.INVOKE: {
      const [{ invocations: { batch: invocationsList } }] = actualData;
      const invocationsListArray = Array.from(invocationsList);

      if (invocationsListArray.length !== Array.from(expectedData).length) {
        return false;
      }

      invocationsListArray.forEach((invocation: any, index) => {
        const txData = invocation.transaction.data;
        const decoded = contractInterface.parseTransaction({ data: txData });

        const expectedEntry = expectedData[index];
        if (decoded.name !== expectedEntry.name || decoded.args[0] !== expectedEntry.value) {
          return false;
        }
      });

      return true;
    }

    case MOBYMASK_MESSAGE_KINDS.REVOKE: {
      const { signedDelegation } = actualData;
      return _.isEqual(signedDelegation, expectedData);
    }

    default:
      return false;
  }
};
