import { RawEmployeeRow, RawEmployerRow } from '../types';
import { normAsset, normDate } from './parser';

export function getSampleDataPullSheet(): RawEmployeeRow[] {
  const rawList = [
    // Devashish Bhardwaj (Real Test Case with API Restauration)
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'API Restauration', date: '02-08-2026', mins: 120, type: 'updatedFull' },
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'API Restauration', date: '02-08-2026', mins: 30, type: 'updatedReviewFull' },
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'Royal Hordijk Group', date: '03-08-2026', mins: 25, type: 'updatedReviewFull' },
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'FENZI Group Asset', date: '04-08-2026', mins: 180, type: 'updatedFull' },
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'ReachLink Portal', date: '05-08-2026', mins: 70, type: 'updatedLimited' },
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'Salus Healthcare', date: '05-08-2026', mins: 30, type: 'updatedFull' }, // Mismatch test: planning has Update (limited)
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'Unplanned Sprint Note', date: '06-08-2026', mins: 45, type: 'updatedReviewLimited' }, // Missing in planning test
    { first: 'Devashish', last: 'Bhardwaj', uid: '9350', asset: 'SK hynix Deep Dive', date: '07-08-2026', mins: 90, type: 'firstReview' }, // Non-update type (ignored)

    // Arthur Pendelton - clean matches
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'Acme Corp Q3 Filing', date: '08-08-2026', mins: 45, type: 'updatedFull' },
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'BioTech Solutions Overview', date: '09-08-2026', mins: 60, type: 'updatedReviewFull' },
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'CyberSec Systems Guide', date: '10-08-2026', mins: 30, type: 'updatedLimited' },
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'Delta Logistics Audit Doc', date: '11-08-2026', mins: 40, type: 'updatedReviewLimited' },
    
    // Arthur Pendelton - Mismatches and Edge Cases
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'Echo Energy Prospectus', date: '10-08-2026', mins: 90, type: 'updatedFull' }, // Employer has Update (limited)
    { first: 'Arthur', last: 'Pendelton', uid: 'EMP-104', asset: 'Falcon Aerospace Spec Sheet', date: '12-08-2026', mins: 55, type: 'updatedReviewFull' }, // Missing in employer sheet
    
    // Eleanor Vance
    { first: 'Eleanor', last: 'Vance', uid: 'EMP-109', asset: 'Jupiter Media Campaign', date: '08-08-2026', mins: 50, type: 'updatedFull' },
    { first: 'Eleanor', last: 'Vance', uid: 'EMP-109', asset: 'Kite Robotics Dossier', date: '09-08-2026', mins: 35, type: 'updatedReviewLimited' }
  ];

  return rawList.map((r) => {
    const name = `${r.first} ${r.last}`.trim();
    return {
      name,
      nameKey: name.toLowerCase(),
      firstName: r.first,
      lastName: r.last,
      userId: r.uid,
      assetName: r.asset,
      assetKey: normAsset(r.asset),
      date: normDate(r.date),
      minutes: r.mins,
      type: r.type
    };
  });
}

export function getSampleEmployerPlanningSheet(): RawEmployerRow[] {
  const rawList = [
    // Matches Devashish Bhardwaj (Clean matches: API Restauration, Royal Hordijk, FENZI, ReachLink)
    { asset: 'API Restauration', date: '02-08-2026', prod: 'Update (full)', rev: 'Update R (full)', status: 'Done' },
    { asset: 'Royal Hordijk Group', date: '03-08-2026', prod: '', rev: 'Update R (full)', status: 'Done' },
    { asset: 'FENZI Group Asset', date: '04-08-2026', prod: 'Update (full)', rev: '', status: 'Done' },
    { asset: 'ReachLink Portal', date: '05-08-2026', prod: 'Update (limited)', rev: '', status: 'Done' },
    { asset: 'Salus Healthcare', date: '05-08-2026', prod: 'Update (limited)', rev: '', status: 'Done' }, // Mismatch: pull has updatedFull
    
    // Terrena (Test case for Daily Planning sheet Update (full) missing in Data Pull Sheet)
    { asset: 'Terrena Agronomy Report', date: '04-08-2026', prod: 'Update (full)', rev: '', status: 'Done' },

    // Non-tracked category in employer record (e.g. standard Full - ignored by design)
    { asset: 'Virtus Bologna Overview', date: '04-08-2026', prod: 'Full', rev: '', status: 'Done' },

    // Matches Arthur Pendelton
    { asset: 'Acme Corp Q3 Filing', date: '08-08-2026', prod: 'Update (full)', rev: '', status: 'Done' },
    { asset: 'BioTech Solutions Overview', date: '09-08-2026', prod: '', rev: 'Update R (full)', status: 'Done' },
    { asset: 'CyberSec Systems Guide', date: '10-08-2026', prod: 'Update (limited)', rev: '', status: 'Done' },
    { asset: 'Delta Logistics Audit Doc', date: '11-08-2026', prod: '', rev: 'Update R (limited)', status: 'Done' },
    { asset: 'Echo Energy Prospectus', date: '10-08-2026', prod: 'Update (limited)', rev: '', status: 'Done' }
  ];

  return rawList.map((r) => ({
    assetName: r.asset,
    assetKey: normAsset(r.asset),
    date: normDate(r.date),
    production: r.prod,
    review: r.rev,
    status: r.status
  }));
}
