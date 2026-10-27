import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { MOCK_WEATHER } from '../../src/mocks/weather';
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

  it('converte 0 °C para 32 °F no painel ao selecionar a unidade e permite voltar', async () => {
    const user = userEvent.setup();
    const current = {
      ...MOCK_WEATHER.current,
      temperatureC: 0,
      apparentTemperatureC: 0,
    };

    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather city={MOCK_WEATHER.city} current={current} unit={unit} />
        </>
      );
    }

    render(<WeatherWithUnitToggle />);
    const panel = within(screen.getByRole('region', { name: 'São Paulo' }));

    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(panel.getByText('0,0 °C')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(panel.getByText('32,0 °F')).toBeInTheDocument();
    expect(panel.getByText('Sensação térmica: 32,0 °F')).toBeInTheDocument();
    expect(panel.queryByText('0,0 °C')).not.toBeInTheDocument();
    expect(panel.getByText('12,6 km/h')).toBeInTheDocument();
    expect(current.temperatureC).toBe(0);

    await user.click(screen.getByRole('button', { name: '°C' }));

    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(panel.getByText('0,0 °C')).toBeInTheDocument();
    expect(panel.getByText('Sensação térmica: 0,0 °C')).toBeInTheDocument();
    expect(panel.queryByText('32,0 °F')).not.toBeInTheDocument();
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
