import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it.each(['celsius', 'fahrenheit'] as const)('expõe a unidade %s recebida por props', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
  });

  it('informa a seleção por clique e mantém a prop como fonte do estado', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange).toHaveBeenLastCalledWith('celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('permite navegar com Tab e Shift+Tab e selecionar com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function ControlledToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <UnitToggle
          unit={unit}
          onChange={(value) => {
            setUnit(value);
            onChange(value);
          }}
        />
      );
    }
    render(<ControlledToggle />);

    await user.tab();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toHaveFocus();
    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toHaveFocus();
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('não submete um formulário ao selecionar a unidade', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
