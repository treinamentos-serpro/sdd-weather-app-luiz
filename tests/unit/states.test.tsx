import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia o carregamento padrão como status', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('aceita mensagem para a operação em andamento', () => {
    render(<LoadingState message="Buscando cidades..." />);
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades...');
  });
});

describe('ErrorState', () => {
  it('anuncia a mensagem da spec e executa retry apenas após clique', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação. Tente novamente.',
    );
    expect(onRetry).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(['{Enter}', ' '])('permite retry pelo teclado usando %s', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha ao buscar cidades." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao buscar cidades.');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('não submete um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onRetry = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState onRetry={onRetry} />
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('exibe título e dica com a mensagem de busca vazia da spec', () => {
    render(<EmptyState />);
    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada.' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(screen.getByRole('status')).toHaveTextContent('Verifique a busca e tente novamente.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('aceita título e dica para o estado inicial', () => {
    render(<EmptyState title="Consulte o clima" hint="Busque uma cidade para começar." />);
    expect(screen.getByRole('heading', { name: 'Consulte o clima' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Busque uma cidade para começar.');
  });
});
