import request from 'supertest';

// E2E prerequisites:
// - App running on BASE_URL
// - Provide USER_JWT (member of COMMUNITY_ID) and ADMIN_JWT (admin role)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_JWT = process.env.USER_JWT || '';
const ADMIN_JWT = process.env.ADMIN_JWT || '';
const COMMUNITY_ID = process.env.COMMUNITY_ID || '';

describe('Direct Messages E2E', () => {
  if (!USER_JWT) {
    console.warn('USER_JWT not set; skipping DM E2E tests.');
    return;
  }

  let communityConvId = '';
  let helpConvId = '';

  it('should start a community DM conversation', async () => {
    if (!COMMUNITY_ID) {
      console.warn('COMMUNITY_ID not set; skipping community DM start');
      return;
    }
    const res = await request(BASE_URL)
      .post('/dm/community/start')
      .set('Authorization', `Bearer ${USER_JWT}`)
      .send({ communityId: COMMUNITY_ID });
    expect([200, 201]).toContain(res.status);
    expect(res.body?.conversation?._id).toBeDefined();
    communityConvId = res.body.conversation._id;
  });

  it('should list messages of community conversation', async () => {
    if (!communityConvId) return;
    const res = await request(BASE_URL)
      .get(`/dm/${communityConvId}/messages?page=1&limit=10`)
      .set('Authorization', `Bearer ${USER_JWT}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('should send a text message in community conversation', async () => {
    if (!communityConvId) return;
    const res = await request(BASE_URL)
      .post(`/dm/${communityConvId}/messages`)
      .set('Authorization', `Bearer ${USER_JWT}`)
      .send({ text: 'Hello from e2e test' });
    expect([200, 201]).toContain(res.status);
    expect(res.body?.message?._id).toBeDefined();
  });

  it('should mark community conversation as read', async () => {
    if (!communityConvId) return;
    const res = await request(BASE_URL)
      .patch(`/dm/${communityConvId}/read`)
      .set('Authorization', `Bearer ${USER_JWT}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
  });

  it('should start a help thread', async () => {
    const res = await request(BASE_URL)
      .post('/dm/help/start')
      .set('Authorization', `Bearer ${USER_JWT}`)
      .send();
    expect([200, 201]).toContain(res.status);
    expect(res.body?.conversation?._id).toBeDefined();
    helpConvId = res.body.conversation._id;
  });

  it('admin should list help queue', async () => {
    if (!ADMIN_JWT) {
      console.warn('ADMIN_JWT not set; skipping admin steps');
      return;
    }
    const res = await request(BASE_URL)
      .get('/dm/help/queue')
      .set('Authorization', `Bearer ${ADMIN_JWT}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('admin should assign or auto-assign and reply to help thread', async () => {
    if (!ADMIN_JWT || !helpConvId) return;
    // Try explicit assign
    await request(BASE_URL)
      .patch(`/dm/help/${helpConvId}/assign`)
      .set('Authorization', `Bearer ${ADMIN_JWT}`)
      .send();

    const res = await request(BASE_URL)
      .post(`/dm/${helpConvId}/messages`)
      .set('Authorization', `Bearer ${ADMIN_JWT}`)
      .send({ text: 'Admin here to help (e2e)' });
    expect([200, 201]).toContain(res.status);
    expect(res.body?.message?._id).toBeDefined();
  });
});


