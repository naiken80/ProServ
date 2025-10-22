import 'server-only';

import { projectSummaries } from '../../data/mock-projects';

export async function fetchProjectSummaries() {
  // TODO: replace with REST/GraphQL call once backend endpoints are available
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { cache: 'no-store' });
  // if (!response.ok) {
  //   throw new Error('Failed to fetch projects');
  // }
  // return response.json();
  return projectSummaries;
}
