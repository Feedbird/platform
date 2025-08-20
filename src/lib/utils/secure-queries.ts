// Secure select queries that exclude sensitive tokens
export const SECURE_SOCIAL_ACCOUNT_FIELDS = `
  id,
  platform,
  name,
  account_id,
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
    account_id
  )
`;

// Helper functions for common secure queries
export const getSecureSocialAccountsQuery = (brandId: string) => ({
  from: 'social_accounts',
  select: SECURE_SOCIAL_ACCOUNT_WITH_PAGES,
  eq: { brand_id: brandId },
  order: { created_at: 'asc' }
});

export const getSecureBrandWithSocialQuery = (brandId: string) => ({
  from: 'brands',
  select: `*, social_accounts (${SECURE_SOCIAL_ACCOUNT_WITH_PAGES})`,
  eq: { id: brandId }
});
