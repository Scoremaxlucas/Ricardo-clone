import { sicPaths, sicUrl } from '@/lib/sic/config'
import {
  buildSicEmailChangeConfirmUrl,
  canChangeSicEmail,
  evaluateSicEmailChangeConfirm,
  evaluateSicEmailChangeRequest,
  sicPendingEmailChangeStatus,
} from '@/lib/sic/email-change'
import { describe, expect, it } from 'vitest'

describe('canChangeSicEmail', () => {
  it('allows a change only while emailChangedAt is empty', () => {
    expect(canChangeSicEmail(null)).toBe(true)
    expect(canChangeSicEmail(undefined)).toBe(true)
    expect(canChangeSicEmail(new Date('2026-09-01T10:00:00.000Z'))).toBe(false)
  })
})

describe('evaluateSicEmailChangeRequest', () => {
  const base = {
    currentEmail: 'typo@example.com',
    emailChangedAt: null as Date | null,
    takenByOther: false,
  }

  it('accepts a different valid address', () => {
    expect(
      evaluateSicEmailChangeRequest({ ...base, newEmailRaw: '  Real@Example.CH ' })
    ).toEqual({ ok: true, email: 'real@example.ch' })
  })

  it('rejects the same address, invalid input, a second change, and a taken address', () => {
    expect(evaluateSicEmailChangeRequest({ ...base, newEmailRaw: 'TYPO@example.com' })).toEqual({
      ok: false,
      code: 'same',
    })
    expect(evaluateSicEmailChangeRequest({ ...base, newEmailRaw: 'not-an-email' })).toEqual({
      ok: false,
      code: 'invalid',
    })
    expect(
      evaluateSicEmailChangeRequest({
        ...base,
        newEmailRaw: 'real@example.ch',
        emailChangedAt: new Date('2026-09-01T10:00:00.000Z'),
      })
    ).toEqual({ ok: false, code: 'already_changed' })
    expect(
      evaluateSicEmailChangeRequest({ ...base, newEmailRaw: 'taken@example.ch', takenByOther: true })
    ).toEqual({ ok: false, code: 'taken' })
  })
})

describe('evaluateSicEmailChangeConfirm', () => {
  const future = new Date('2026-09-03T12:00:00.000Z')
  const now = new Date('2026-09-03T11:00:00.000Z')

  it('accepts a live pending address', () => {
    expect(
      evaluateSicEmailChangeConfirm({
        pendingEmail: 'real@example.ch',
        pendingEmailExpiresAt: future,
        emailChangedAt: null,
        takenByOther: false,
        now,
      })
    ).toEqual({ ok: true, email: 'real@example.ch' })
  })

  it('rejects expired, already changed, missing, and taken', () => {
    expect(
      evaluateSicEmailChangeConfirm({
        pendingEmail: 'real@example.ch',
        pendingEmailExpiresAt: now,
        emailChangedAt: null,
        takenByOther: false,
        now,
      })
    ).toEqual({ ok: false, code: 'invalid' })
    expect(
      evaluateSicEmailChangeConfirm({
        pendingEmail: 'real@example.ch',
        pendingEmailExpiresAt: future,
        emailChangedAt: now,
        takenByOther: false,
        now,
      })
    ).toEqual({ ok: false, code: 'invalid' })
    expect(
      evaluateSicEmailChangeConfirm({
        pendingEmail: null,
        pendingEmailExpiresAt: future,
        emailChangedAt: null,
        takenByOther: false,
        now,
      })
    ).toEqual({ ok: false, code: 'invalid' })
    expect(
      evaluateSicEmailChangeConfirm({
        pendingEmail: 'taken@example.ch',
        pendingEmailExpiresAt: future,
        emailChangedAt: null,
        takenByOther: true,
        now,
      })
    ).toEqual({ ok: false, code: 'taken' })
  })
})

describe('sicPendingEmailChangeStatus', () => {
  const future = new Date('2026-09-03T12:00:00.000Z')
  const now = new Date('2026-09-03T11:00:00.000Z')

  it('is valid only with token, address and unexpired window', () => {
    expect(
      sicPendingEmailChangeStatus(
        {
          pendingEmail: 'real@example.ch',
          pendingEmailToken: 'tok',
          pendingEmailExpiresAt: future,
        },
        now
      )
    ).toBe('valid')
    expect(
      sicPendingEmailChangeStatus(
        {
          pendingEmail: 'real@example.ch',
          pendingEmailToken: 'tok',
          pendingEmailExpiresAt: now,
        },
        now
      )
    ).toBe('invalid')
    expect(sicPendingEmailChangeStatus(null, now)).toBe('invalid')
  })
})

describe('buildSicEmailChangeConfirmUrl', () => {
  it('points at the confirm page, not the consume endpoint', () => {
    const url = buildSicEmailChangeConfirmUrl('tok_abc')
    expect(url).toContain(sicPaths.emailConfirm)
    expect(url).toContain('token=tok_abc')
    expect(url).not.toContain(sicPaths.emailConfirmApi)
    expect(sicUrl(sicPaths.emailConfirmApi)).toMatch(/\/api\/sic\/email\/confirm$/)
  })
})
