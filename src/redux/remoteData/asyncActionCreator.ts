import { Dispatch } from 'redux';
import { Issue, CountData } from './../../common/model';
import {
  getAllIssues,
  getCountData,
  postBackfillOutcomes,
  getUserCallDetails,
  getContacts
} from '../../services/apiServices';
import { issuesActionCreator, callCountActionCreator } from './index';
import { clearContactIndexes } from '../callState/';
import { ApplicationState } from '../root';
import { LoginService, UserProfile } from '@5calls/react-components';
import { Auth0Config } from '../../common/constants';
import { UserContactEvent } from '../userStats';
import { setUploadedActionCreator } from '../userStats/actionCreator';
import {
  clearProfileActionCreator,
  setAuthTokenActionCreator,
  setProfileActionCreator
} from '../userState';
import { store } from '../store';
import { ContactList } from '../../common/contactList';
import { setInvalidAddress, setCachedCity } from '../location/actionCreator';
import { contactsActionCreator } from './actionCreator';

export const getIssuesIfNeeded = () => {
  const state = store.getState();

  // Only make the api call if it hasn't already been made
  if (
    !state.remoteDataState.issues ||
    state.remoteDataState.issues.length === 0
  ) {
    getAllIssues()
      .then((response: Issue[]) => {
        store.dispatch(issuesActionCreator(response));
      })
      .catch(error => {
        // tslint:disable-next-line:no-console
        console.error(`error getting issues: ${error.message}`, error);
      });
  }
};

export const getContactsIfNeeded = () => {
  const state = store.getState();

  // Senate should be the easiest to get, so let's do test that for validity
  if (state.remoteDataState.contacts.senate.length === 0) {
    getContacts()
      .then((contactList: ContactList) => {
        store.dispatch(contactsActionCreator(contactList));
        store.dispatch(setCachedCity(contactList.location));
        store.dispatch(setInvalidAddress(false));
      })
      .catch(error => {
        // tslint:disable-next-line:no-console
        console.error('couldnt fetch contacts: ', error);
        store.dispatch(setInvalidAddress(true));
      });
  }
};

export const fetchCallCount = () => {
  return (
    dispatch: Dispatch<ApplicationState>,
    getState: () => ApplicationState
  ) => {
    return getCountData()
      .then((response: CountData) => {
        dispatch(callCountActionCreator(response.count));
      })
      .catch(error =>
        // tslint:disable-next-line:no-console
        console.error(`fetchCallCount error: ${error.message}`, error)
      );
  };
};

export const fetchDonations = () => {
  return (
    dispatch: Dispatch<ApplicationState>,
    getState: () => ApplicationState
  ) => {
    return;
    // return getDonations()
    //   .then((response: DonationGoal) => {
    //     const donations: Donations = response.goal;
    //     dispatch(donationsActionCreator(donations));
    //   })
    //   // tslint:disable-next-line:no-console
    //   .catch(e => console.error(`fetchDonations error: ${e.message}`, e));
  };
};

// export const fetchLocationByIP = () => {
//   return (dispatch: Dispatch<ApplicationState>,
//           getState: () => ApplicationState) => {
//     clearTimeout(setTimeoutHandle);
//     dispatch(setUiState(LocationUiState.FETCHING_LOCATION));
//     return getLocationByIP()
//         .then((response: IpInfoData) => {
//           dispatch(setLocationFetchType(LocationFetchType.IP_INFO));
//           const location = response.loc;
//           // tslint:disable-next-line:no-any
//           dispatch<any>(fetchAllIssues(location))
//           .then(() => {
//             // tslint:disable-next-line:no-any
//             dispatch<any>(setUiState(LocationUiState.LOCATION_FOUND));
//           });
//           // TODO: dispatch an error message
//         }).catch((error) => {
//           // tslint:disable-next-line:no-console
//           console.error(`fetchLocationByIP error: ${error.message}`, error);
//           // set location to empty string to trigger location error
//           // tslint:disable-next-line:no-any
//           dispatch<any>(fetchAllIssues(''));
//         });
//     // }
//   };
// };

export const fetchBrowserGeolocation = () => {
  return (
    dispatch: Dispatch<ApplicationState>,
    getState: () => ApplicationState
  ) => {
    // // Sometimes, the user ignores the prompt or the browser does not
    // // provide a response when they do not permit browser location.
    // // After GEOLOCATION_TIMEOUT + 1 second, try IP-based location,
    // // but let browser-based continue. This timeout is cleared after
    // // either geolocation or ipinfo.io location succeeds.
    // dispatch(setUiState(LocationUiState.FETCHING_LOCATION));
    // const state = getState();
    // const fetchType = state.locationState.locationFetchType;
    // // const useGeolocation = state.locationState.useGeolocation || null;
    // // tslint:disable-next-line:no-shadowed-variable no-any
    // setTimeoutHandle = setTimeout(() => dispatch<any>(fetchLocationByIP()), GEOLOCATION_TIMEOUT + 1000);
    // // fetchType will be undefined at first
    // if (fetchType === undefined || fetchType === LocationFetchType.BROWSER_GEOLOCATION) {
    //   getBrowserGeolocation()
    //     .then(location => {
    //       if (location.latitude && location.longitude) {
    //         dispatch(setLocationFetchType(LocationFetchType.BROWSER_GEOLOCATION));
    //         const loc = `${location.latitude},${location.longitude}`;
    //         // tslint:disable-next-line:no-any
    //         dispatch<any>(fetchAllIssues(loc));
    //         clearTimeout(setTimeoutHandle);
    //       } else {
    //         // tslint:disable-next-line:no-any
    //         dispatch<any>(fetchLocationByIP());
    //       }
    //     })
    //     .catch(e => {
    //       // tslint:disable-next-line:no-console
    //       console.error('Problem getting browser geolocation', e);
    //       // tslint:disable-next-line:no-any
    //       dispatch<any>(fetchLocationByIP());
    //     });
    // } else {
    //   // tslint:disable-next-line:no-any
    //   dispatch<any>(fetchLocationByIP());
    // }
  };
};

export const uploadStatsIfNeeded = () => {
  return (
    dispatch: Dispatch<ApplicationState>,
    getState: () => ApplicationState
  ) => {
    const state: ApplicationState = getState();

    if (state.userState.idToken) {
      let unuploadedStats: UserContactEvent[] = [];

      for (let i = 0; i < state.userStatsState.all.length; i++) {
        if (!state.userStatsState.all[i].uploaded) {
          unuploadedStats.push(state.userStatsState.all[i]);
          dispatch(setUploadedActionCreator(state.userStatsState.all[i].time));
        }
      }

      if (unuploadedStats.length > 0) {
        postBackfillOutcomes(unuploadedStats, state.userState.idToken);
      }
    }
  };
};

export interface UserCallDetails {
  stats: UserStats;
  weeklyStreak: number;
  firstCallTime: number;
  calls: DailyCallReport[];
}

export interface DailyCallReport {
  date: string;
  issues: IssueSummary[];
}

export interface IssueSummary {
  count: number;
  issue_name: string;
}

export interface UserStats {
  voicemail: number;
  unavailable: number;
  contact: number;
}

export const getProfileInfo = async (): Promise<UserProfile> => {
  const state = store.getState();

  if (state.userState.profile && state.userState.idToken) {
    const callDetails = await getUserCallDetails(state.userState.idToken);
    // attach details to token profile
    let filledProfile = state.userState.profile;
    filledProfile.callDetails = callDetails;

    return filledProfile;
  } else {
    // not logged in
  }

  return Promise.reject('no profile sorry');
};

export const startup = () => {
  const state = store.getState();

  // clear contact indexes loaded from local storage
  store.dispatch(clearContactIndexes());

  // check expired login and handle or logout
  const auth = new LoginService(Auth0Config);
  if (state.userState.profile && state.userState.idToken) {
    auth
      .checkAndRenewSession(state.userState.profile, state.userState.idToken)
      .then(authResponse => {
        // Set the updated profile ourselves - auth is a component that doesn't know about redux
        store.dispatch(setAuthTokenActionCreator(authResponse.authToken));
        store.dispatch(setProfileActionCreator(authResponse.userProfile));
      })
      .catch(error => {
        // clear the session
        store.dispatch(clearProfileActionCreator());
      });
  }

  // const loc = state.locationState.address;

  // if (loc) {
  //   // tslint:disable-next-line:no-any
  //   store.dispatch<any>(fetchAllIssues())
  //   .then(() => {
  //     setLocationFetchType(LocationFetchType.CACHED_ADDRESS);
  //   });
  // } else {
  //   // tslint:disable-next-line:no-any
  //   store.dispatch<any>(fetchBrowserGeolocation());
  // }
  // // tslint:disable-next-line:no-any
  // store.dispatch<any>(fetchCallCount());
};
