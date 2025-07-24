import { GET, POST } from '../vaults/route'
import { NextRequest } from 'next/server'

describe('/api/vaults', () => {
  describe('GET', () => {
    it('should return list of vaults', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      expect(data.chainId).toBe(713715)
    })

    it('should filter vaults by strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults?strategy=concentrated_liquidity')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((vault: any) => vault.strategy === 'concentrated_liquidity')).toBe(true)
    })

    it('should filter vaults by active status', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults?active=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((vault: any) => vault.active === true)).toBe(true)
    })

    it('should return vault with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults')
      const response = await GET(request)
      const data = await response.json()

      const vault = data.data[0]
      expect(vault).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        name: expect.any(String),
        strategy: expect.stringMatching(/^(concentrated_liquidity|yield_farming|arbitrage|hedge)$/),
        tokenA: expect.any(String),
        tokenB: expect.any(String),
        fee: expect.any(Number),
        tickSpacing: expect.any(Number),
        tvl: expect.any(Number),
        apy: expect.any(Number),
        chainId: 713715,
        active: expect.any(Boolean),
        performance: expect.objectContaining({
          totalReturn: expect.any(Number),
          sharpeRatio: expect.any(Number),
          maxDrawdown: expect.any(Number),
          winRate: expect.any(Number)
        })
      })
    })
  })

  describe('POST', () => {
    const validVaultData = {
      name: 'Test Vault',
      strategy: 'concentrated_liquidity' as const,
      tokenA: 'SEI',
      tokenB: 'USDC',
      fee: 0.003,
      tickSpacing: 60,
      chainId: 713715
    }

    it('should create a new vault with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validVaultData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        ...validVaultData,
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        tvl: 0,
        apy: 0,
        active: true,
        createdAt: expect.any(String)
      })
    })

    it('should reject vault with invalid chain ID', async () => {
      const invalidData = { ...validVaultData, chainId: 1 }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('should reject vault with missing required fields', async () => {
      const invalidData = { name: 'Test Vault' }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.details).toBeDefined()
    })

    it('should reject vault with invalid strategy', async () => {
      const invalidData = { ...validVaultData, strategy: 'invalid_strategy' }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
