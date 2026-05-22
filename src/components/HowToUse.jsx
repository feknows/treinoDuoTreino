export default function HowToUse() {
  return (
    <div className="card">
      <h2>Como Usar</h2>

      <div className="how-section">
        <div className="how-step">
          <div className="how-icon">0️⃣</div>
          <div className="how-body">
            <h3>Faça Login</h3>
            <p>Use seu email e senha para entrar. Seus dados são pessoais e protegidos. Precisa recuperar a senha? Use <strong>Esqueceu a senha?</strong> na tela de login.</p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-icon">1️⃣</div>
          <div className="how-body">
            <h3>Cadastre Exercícios e Equipamentos</h3>
            <p>Vá na aba <strong>Gerenciar</strong> e adicione os exercícios que você faz (ex: Supino Reto, Rosca Direta, Agachamento) e os equipamentos que usa (ex: Barra Reta, Halteres, Máquina Smith).</p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-icon">2️⃣</div>
          <div className="how-body">
            <h3>Registre Seu Treino</h3>
            <p>Na aba <strong>Registrar</strong>, selecione o exercício, equipamento, data, carga (kg), séries e repetições. Clique em "Salvar Treino".</p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-icon">3️⃣</div>
          <div className="how-body">
            <h3>Consulte o Histórico</h3>
            <p>Na aba <strong>Histórico</strong>, veja todos os registros. Filtre por data ou exercício para encontrar rapidamente. Use o ✕ para excluir se errar.</p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-icon">4️⃣</div>
          <div className="how-body">
            <h3>Acompanhe a Evolução</h3>
            <p>Na aba <strong>Progresso</strong>, selecione um exercício e veja o gráfico da sua evolução. Escolha entre três métricas:</p>
            <ul className="how-metrics">
              <li><strong>1RM Estimado</strong> — sua força máxima teórica com base na fórmula de Epley</li>
              <li><strong>Carga Máxima</strong> — o maior peso que você usou no exercício</li>
              <li><strong>Volume Total</strong> — carga × séries × repetições (volume total do treino)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="how-tips">
        <h3>💡 Dicas</h3>
        <ul>
          <li>Use o app do celular — adicione à tela inicial para acesso rápido</li>
          <li>Registre sempre logo após o treino para não esquecer os dados</li>
          <li>Compare treinos anteriores para saber se está evoluindo a carga</li>
          <li>O 1RM estimado ajuda a saber se você está mais forte mesmo com repetições diferentes</li>
        </ul>
      </div>
    </div>
  )
}
