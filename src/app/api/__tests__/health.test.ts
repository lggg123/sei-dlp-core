import { GET } from '../health/route'

describe('/api/health', () => {
  describe('GET', () => {
    it('should return healthy status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        status: 'healthy',
        version: '1.0.0',
        chain: 'SEI',
        chainId: 713715,
        services: expect.any(Object)
      })
      expect(data.timestamp).toBeDefined()
      expect(data.services.api).toBe('operational')
      expect(data.services.ai_engine).toBe('operational')
      expect(data.services.blockchain).toBe('operational')
    })

    it('should have valid timestamp format', async () => {
      const response = await GET()
      const data = await response.json()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.toISOString()).toBe(data.timestamp)
    })

    it('should include correct SEI chain configuration', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.chainId).toBe(713715)
      expect(data.chain).toBe('SEI')
    })
  })
})
