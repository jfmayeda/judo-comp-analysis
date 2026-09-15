'use client';

import Link from 'next/link';
import { DESIGN_TOKEN_GROUPS, type DesignToken, type TokenKind } from '@/lib/design-tokens';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip, Pill } from '@/components/ui/Chip';

function Swatch({ token }: { token: DesignToken }) {
  if (token.kind === 'color') {
    return (
      <div>
        <div
          data-token={token.name}
          className="mb-2"
          style={{
            height: 56,
            width: '100%',
            background: `var(${token.name})`,
            border: '2px solid var(--svj-navy-900)',
          }}
          aria-hidden
        />
        <p className="font-heading text-xs uppercase tracking-wide text-svj-navy-900">
          {token.label}
        </p>
        <p className="text-svj-gray-600 text-sm truncate">{token.name}</p>
      </div>
    );
  }

  if (token.kind === 'space') {
    return (
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-svj-navy-900 mb-2">
          {token.label}
        </p>
        <div className="bg-svj-blue-600 h-3" style={{ width: `var(${token.name})` }} />
        <p className="text-svj-gray-600 text-sm mt-1">{token.name}</p>
      </div>
    );
  }

  if (token.kind === 'radius') {
    const isWidth = token.name.includes('border-width');
    return (
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-svj-navy-900 mb-2">
          {token.label}
        </p>
        <div
          className="h-12 w-20 bg-svj-paper"
          style={
            isWidth
              ? { border: `var(${token.name}) solid var(--svj-navy-900)` }
              : {
                  background: 'var(--svj-blue-600)',
                  border: '2px solid var(--svj-navy-900)',
                  borderRadius: `var(${token.name})`,
                }
          }
        />
        <p className="text-svj-gray-600 text-sm mt-1">{token.name}</p>
      </div>
    );
  }

  if (token.kind === 'shadow') {
    return (
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-svj-navy-900 mb-2">
          {token.label}
        </p>
        <div
          className="h-16 w-24 bg-svj-white border-2 border-svj-navy-800"
          style={{ boxShadow: `var(${token.name})` }}
        />
        <p className="text-svj-gray-600 text-sm mt-1">{token.name}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-wide text-svj-navy-900">
        {token.label}
      </p>
      <p className="text-svj-gray-600 text-sm">{token.name}</p>
      {token.kind === 'type' && token.name.includes('font') && (
        <p className="mt-1 text-base" style={{ fontFamily: `var(${token.name})` }}>
          Silicon Valley Judo
        </p>
      )}
    </div>
  );
}

const KIND_GRID: Record<TokenKind, string> = {
  color: 'grid gap-4 sm:grid-cols-2',
  type: 'grid gap-4',
  space: 'grid gap-4',
  radius: 'grid gap-4 grid-cols-2 sm:grid-cols-3',
  shadow: 'grid gap-6 grid-cols-2',
  motion: 'grid gap-3',
};

export function DesignTokensGallery() {
  return (
    <div className="space-y-10">
      {DESIGN_TOKEN_GROUPS.map((group) => (
        <section key={group.id} id={group.id}>
          <p className="eyebrow mb-2">{group.id}</p>
          <h3 className="text-xl mb-4">{group.label}</h3>
          <Card className="p-4 md:p-6">
            <div className={KIND_GRID[group.tokens[0].kind]}>
              {group.tokens.map((token) => (
                <Swatch key={token.name} token={token} />
              ))}
            </div>
          </Card>
        </section>
      ))}

      <section id="specimens">
        <p className="eyebrow mb-2">Components</p>
        <h3 className="text-xl mb-4">Specimens</h3>

        <div className="grid gap-4">
          <Card className="p-6">
            <p className="eyebrow mb-2">Default card</p>
            <h4 className="text-2xl mb-2">Alex R.</h4>
            <p className="text-svj-gray-600">Roster glance · tokui-waza, belt, notes</p>
          </Card>

          <Card variant="dark" className="p-6">
            <p className="eyebrow mb-2" style={{ color: 'var(--svj-text-inverse)' }}>
              Dark card
            </p>
            <h4 className="text-2xl mb-2" style={{ color: 'var(--svj-text-inverse)' }}>
              Navy inset
            </h4>
            <p style={{ color: 'var(--svj-text-inverse-muted)' }}>
              For panels on light sections
            </p>
          </Card>

          <Card variant="selected" className="p-6">
            <p className="eyebrow mb-2">Selected card</p>
            <h4 className="text-2xl">Tournament pick</h4>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-4">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="sm">Small</Button>
              <Button as={Link} href="/" variant="secondary" size="sm">
                As link
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Chip>Chip</Chip>
              <Chip pressed>Pressed</Chip>
              <Pill>Pill brand</Pill>
              <Pill tone="navy">Pill navy</Pill>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
