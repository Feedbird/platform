// Secure select queries that exclude sensitive tokens
export const SECURE_SOCIAL_ACCOUNT_FIELDS = `
  id,
  platform,
  name,
  account_id,
  workspace_id,
  connected,
  auth_token,
  refresh_token,
  access_token_expires_at,
  refresh_token_expires_at,
  token_issued_at,
  status,
  metadata,
  created_at,
  updated_at
`;

export const SECURE_SOCIAL_PAGE_FIELDS = `
  id,
  platform,
  entity_type,
  name,
  page_id,
  auth_token,
  connected,
  status,
  account_id,
  workspace_id,
  status_updated_at,
  last_sync_at,
  metadata
`;

export const SECURE_SOCIAL_ACCOUNT_WITH_PAGES = `
  ${SECURE_SOCIAL_ACCOUNT_FIELDS},
  social_pages (
    ${SECURE_SOCIAL_PAGE_FIELDS}
  )
`;

// For operations that need tokens (like disconnect)
export const SOCIAL_ACCOUNT_WITH_TOKENS = `
  id,
  platform,
  name,
  account_id,
  auth_token,
  refresh_token,
  connected,
  status,
  social_pages (
    id,
    platform,
    entity_type,
    name,
    page_id,
    auth_token,
    connected,
    status,
    account_id,
    workspace_id
  )
`;

// Helper functions for common secure queries
export const getSecureSocialAccountsQuery = (workspaceId: string) => ({
  from: 'social_accounts',
  select: SECURE_SOCIAL_ACCOUNT_WITH_PAGES,
  eq: { workspace_id: workspaceId },
  order: { created_at: 'asc' }
});

export const getSecureWorkspaceWithSocialQuery = (workspaceId: string) => ({
  from: 'workspaces',
  select: `*, social_accounts (${SECURE_SOCIAL_ACCOUNT_WITH_PAGES})`,
  eq: { id: workspaceId }
});
