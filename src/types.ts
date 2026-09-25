/**
 * ============================================================================
 * RPG SHEET ENGINE - UNIVERSAL DATA MODEL
 * ============================================================================
 * 
 * Este arquivo define as interfaces TypeScript estritas para os 7 Core Design
 * Patterns de RPG de mesa. Cada padrão representa uma abstração fundamental
 * que pode modelar mecânicas de QUALQUER sistema de RPG.
 * 
 * Design Philosophy:
 * - Atomicidade: Cada interface representa um componente atômico indivisível.
 * - Extensibilidade: Campos opcionais e genéricos permitem adaptação.
 * - Serialização: Todas as interfaces são JSON-serializáveis.
 * - Type Safety: Strict mode com discriminated unions onde aplicável.
 * ============================================================================
 */

// ============================================================================
// 1. GAUGES (Medidores Lineares)
// ============================================================================
/**
 * Gauges representam barras de progresso com valores discretos.
 * Abstração de: Stats, Currency, Resource, Safety Valve, Skill, Rank,
 * Success Reward, Trait, Wound Trait, Trauma Gauge, Sanidade, Estresse.
 * 
 * Exemplos:
 * - HP em D&D (min:0, max:variável, current:variável, step:1)
 * - Sanity em Call of Cthulhu
 * - Stress em Blades in the Dark
 * - Blood Potency em Vampiro
 */

export type GaugeCategory =
  | 'stat'           // Atributos fundamentais (Força, Destreza, etc.)
  | 'resource'       // Recursos consumíveis (HP, Mana, Sangue)
  | 'currency'       // Moedas de troca (XP, Gold, Fate Points)
  | 'safety_valve'   // Mecânicas de proteção (Sanity, Stress)
  | 'skill'          // Perícias e habilidades numéricas
  | 'rank'           // Níveis de poder ou hierarquia
  | 'wound'          // Ferimentos e penalidades acumuladas
  | 'trauma'         // Danos psicológicos/físicos permanentes
  | 'success_reward' // Recompensas por sucesso (Boosts, Edge)
  | 'trait'          // Características gerais
  | 'custom';        // Categoria customizada

export interface Gauge {
  id: string;
  name: string;
  category: GaugeCategory;
  min: number;
  max: number;
  current: number;
  step: number;           // Incremento/decremento padrão
  description?: string;
  metadata?: Record<string, unknown>; // Dados específicos do sistema
}

// ============================================================================
// 2. DIE ROLLS (Rolagens de Dados)
// ============================================================================
/**
 * DieRolls modelam qualquer sistema de resolução por dados.
 * Abstração de: Pool de dados, modificadores, tipos (d4-d100),
 * condições de sucesso, graus, testes opostos, dados explosivos.
 * 
 * Exemplos:
 * - D&D 5e: d20 + mod vs DC (target_number)
 * - Vampiro: Pool de d10 vs dificuldade (target_number)
 * - Warhammer: d100 vs skill (target_number)
 * - Savage Worlds: Wild Die + Skill Die (exploding)
 */

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type SuccessCondition =
  | 'target_number'      // Rolar >= ou <= um valor fixo
  | 'opposed'            // Comparar contra outra rolagem
  | 'degrees_of_success' // Múltiplos níveis de sucesso
  | 'count_successes'    // Contar dados acima de um threshold (Vampiro)
  | 'sum_total'          // Somar todos os dados
  | 'lookup'             // Usar resultado como índice em tabela
  | 'custom';            // Fórmula customizada

export interface DieRollConfig {
  id: string;
  name: string;
  dice: DiceEntry[];           // Pool de dados a rolar
  modifiers: RollModifier[];   // Bônus/penalidades
  successCondition: SuccessCondition;
  targetNumber?: number;       // Para 'target_number'
  successThreshold?: number;   // Para 'count_successes' (ex: 8 em Vampiro)
  exploding?: boolean;         // Dados que explodem (Savage Worlds)
  rerollOnes?: boolean;        // Reroll de 1s (Savage Worlds Wild Die)
  keepHighest?: number;        // Manter N maiores (D&D advantage)
  keepLowest?: number;         // Manter N menores
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface DiceEntry {
  type: DieType;
  count: number;
  label?: string;  // Ex: "Skill Die", "Wild Die"
}

export interface RollModifier {
  source: string;    // Origem do modificador (ex: "Strength", "Blessing")
  value: number;     // Valor (positivo ou negativo)
  type: 'flat' | 'multiplier' | 'advantage' | 'disadvantage';
}

export interface RollResult {
  rollId: string;
  diceResults: SingleDieResult[];
  modifiers: RollModifier[];
  total: number;
  successes?: number;        // Para 'count_successes'
  degreeOfSuccess?: string;  // Para 'degrees_of_success'
  isSuccess: boolean;
  rawExpression: string;     // Ex: "5d10 + 2 = [8,7,3,10,1] + 2 = 31"
}

export interface SingleDieResult {
  type: DieType;
  value: number;
  kept: boolean;      // Se foi mantido (para keepHighest/keepLowest)
  exploded: boolean;   // Se gerou uma explosão
  label?: string;
}

// ============================================================================
// 3. CARDS (Sistemas de Cartas/Baralhos)
// ============================================================================
/**
 * Cards modelam mecânicas de saque, descarte e embaralhamento.
 * Abstração de: Action Cards (Savage Worlds), Clocks (Blades),
 * Baralhos de Tarot, Poker, sistemas de cartas customizados.
 * 
 * Exemplos:
 * - Savage Worlds Action Deck: 54 cartas + Jokers
 * - Fate Cards: Baralho customizado com aspectos
 * - Clocks (Blades): "Cartas" de progresso circular
 */

export type DeckType = 'poker' | 'tarot' | 'custom' | 'clock';

export interface CardDeck {
  id: string;
  name: string;
  type: DeckType;
  cards: Card[];
  drawPile: string[];    // IDs das cartas no monte de compra
  discardPile: string[]; // IDs das cartas na pilha de descarte
  hand: string[];        // IDs das cartas na mão
  shuffleOnEmpty: boolean; // Embaralhar descarte quando monte acabar
  metadata?: Record<string, unknown>;
}

export interface Card {
  id: string;
  name: string;
  suit?: string;         // Ex: "Hearts", "Major Arcana"
  value?: number | string; // Valor numérico ou textual
  description?: string;
  effects?: CardEffect[];
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CardEffect {
  type: string;          // Ex: "initiative_bonus", "damage", "trigger_event"
  value: number | string;
  target?: string;       // ID do gauge ou componente afetado
  duration?: string;     // Ex: "instant", "until_rest", "permanent"
}

// ============================================================================
// 4. FUZZY GAUGES (Medidores Difusos/Descritivos)
// ============================================================================
/**
 * FuzzyGauges modelam escalas não-lineares baseadas em texto ou estados.
 * Abstração de: Gifts, Talents, Feats, Spiritual Attributes,
 * Condições (Apocalypse World), Ladder (Fate), Níveis de Exaustão.
 * 
 * Exemplos:
 * - Fate Ladder: [Terrible, Poor, Mediocre, Fair, Good, Great, Superb]
 * - D&D Exhaustion: 6 níveis com efeitos descritivos
 * - PbtA Conditions: [Afraid, Angry, Guilty, Hopeless, Insecure]
 * - Vampiro: Humanidade (escala descritiva)
 */

export type FuzzyGaugeType =
  | 'ladder'       // Escala ordenada (Fate)
  | 'conditions'   // Condições marcáveis (PbtA)
  | 'feats'        // Lista de talentos/feats
  | 'aspects'      // Aspectos invocáveis (Fate)
  | 'statuses'     // Estados binários (alive/dead, prone, etc.)
  | 'custom';

export interface FuzzyGauge {
  id: string;
  name: string;
  type: FuzzyGaugeType;
  entries: FuzzyEntry[];
  currentValue?: string;  // Para ladder: o label atual
  activeConditions?: string[]; // Para conditions: quais estão ativas
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FuzzyEntry {
  id: string;
  label: string;          // Nome descritivo (ex: "Good", "Afraid")
  rank?: number;          // Posição na escala (para ladder)
  value?: number;         // Bônus numérico associado (Fate: Good = +3)
  description?: string;   // Efeito descritivo
  active?: boolean;       // Se está atualmente ativo/marcado
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 5. TABLE LOOKUPS (Tabelas de Consulta)
// ============================================================================
/**
 * TableLookups modelam matrizes/dicionários de resolução.
 * Abstração de: Classes, Templates, Tabelas de Crítico,
 * Clima, Reações de NPC, Geradores aleatórios.
 * 
 * Exemplos:
 * - D&D Critical Hit Table
 * - Vampiro: Generation effects table
 * - Warhammer: Critical tables
 * - Reaction tables (OD&D)
 */

export type TableLookupType =
  | 'range'       // Intervalos numéricos (1-5, 6-10, etc.)
  | 'exact'       // Valores exatos (classe = "Guerreiro")
  | 'matrix'      // Matriz 2D (Ataque vs Defesa)
  | 'nested'      // Tabelas aninhadas
  | 'custom';

export interface LookupTable {
  id: string;
  name: string;
  type: TableLookupType;
  entries: TableEntry[];
  defaultResult?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TableEntry {
  id: string;
  key: string | number | [number, number]; // Chave de lookup (range ou valor)
  result: string;       // Resultado textual
  effects?: TableEffect[]; // Efeitos mecânicos associados
  metadata?: Record<string, unknown>;
}

export interface TableEffect {
  type: string;          // Ex: "damage", "condition", "gauge_modify"
  target?: string;       // ID do componente afetado
  value?: number | string;
  description?: string;
}

// ============================================================================
// 6. CONTESTS (Contestes/Disputas)
// ============================================================================
/**
 * Contests modelam mecânicas de recurso contra recurso.
 * Abstração de: Vontade vs. Controle, Ataque vs. Defesa,
 * Conflicted Gauge, Escalating Conflict, Task Resolution,
 * Negotiated Contest, Contest Tree.
 * 
 * Exemplos:
 * - D&D: Ataque (d20+mod) vs CA (target_number)
 * - Vampiro: Teste estendido (acumular successes)
 * - Fate: Ataque vs. Defesa com shifts
 * - PbtA: Move com 6- (falha), 7-9 (sucesso parcial), 10+ (sucesso)
 */

export type ContestType =
  | 'simple_opposed'    // A vs B, maior vence
  | 'extended'          // Acumular successes até threshold
  | 'escalating'        // Conflict escalona (DramaSystem)
  | 'task_resolution'   // Teste contra dificuldade
  | 'negotiated'        // Jogadores negociam stakes
  | 'conflicted_gauge'  // Gauge sobe/desce baseado em contestes
  | 'resource_vs_resource' // Ambos gastam recurso
  | 'custom';

export interface Contest {
  id: string;
  name: string;
  type: ContestType;
  participants: ContestParticipant[];
  stakes?: ContestStakes;
  resolution?: ContestResolution;
  status: 'pending' | 'active' | 'resolved';
  rounds?: ContestRound[];
  metadata?: Record<string, unknown>;
}

export interface ContestParticipant {
  id: string;
  name: string;
  approach: ContestApproach; // Como participa do conteste
  advantages: string[];      // Vantagens ativas
  disadvantages: string[];   // Desvantagens ativas
  resourceSpent?: number;    // Recurso gasto no conteste
}

export interface ContestApproach {
  gaugeId?: string;        // Gauge usado como base
  dieRollId?: string;      // Roll config usada
  fuzzyEntryId?: string;   // Fuzzy gauge entry usada
  flatBonus?: number;      // Bônus fixo
  description?: string;
}

export interface ContestStakes {
  winnerGets: string;      // O que o vencedor obtém
  loserLoses: string;      // O que o perdedor perde
  tieResult?: string;      // Resultado em caso de empate
}

export interface ContestResolution {
  winnerId?: string;
  loserId?: string;
  margin?: number;         // Margem de vitória
  outcome: 'win' | 'loss' | 'tie' | 'critical' | 'fumble';
  effects: string[];       // Efeitos narrativos/mecânicos
}

export interface ContestRound {
  roundNumber: number;
  participantResults: { participantId: string; result: RollResult }[];
  roundWinner?: string;
}

// ============================================================================
// 7. NODES & TRIGGERS (Gatilhos)
// ============================================================================
/**
 * Nodes & Triggers conectam os padrões acima através de lógica condicional.
 * Abstração de: "Se HP <= 0, aciona tabela de morte",
 * "Se Stress >= max, ganha condição 'Broken'",
 * "Quando carta de Joker é sacada, dobra dano".
 * 
 * Este é o sistema de eventos que dá vida à ficha.
 */

export type TriggerCondition =
  | 'gauge_threshold'    // Gauge atinge valor (>=, <=, ==)
  | 'card_drawn'         // Carta específica é sacada
  | 'roll_result'        // Resultado de rolagem satisfaz condição
  | 'contest_resolved'   // Contest é resolvido
  | 'fuzzy_activated'    // Fuzzy entry é ativada
  | 'manual'             // Ativado manualmente pelo jogador
  | 'composite';         // Combinação de condições (AND/OR)

export type TriggerAction =
  | 'modify_gauge'       // Alterar valor de gauge
  | 'roll_dice'          // Executar rolagem
  | 'draw_card'          // Sacar carta
  | 'activate_condition' // Ativar condição fuzzy
  | 'lookup_table'       // Consultar tabela
  | 'start_contest'      // Iniciar conteste
  | 'narrative'          // Apenas efeito narrativo (texto)
  | 'custom';            // Ação customizada

export interface TriggerNode {
  id: string;
  name: string;
  description?: string;
  condition: TriggerConditionConfig;
  actions: TriggerActionConfig[];
  enabled: boolean;
  priority: number;       // Ordem de execução (menor = primeiro)
  cooldown?: number;      // Rounds/turnos entre ativações
  metadata?: Record<string, unknown>;
}

export interface TriggerConditionConfig {
  type: TriggerCondition;
  targetId: string;       // ID do componente monitorado
  operator?: '>=' | '<=' | '==' | '!=' | '>' | '<';
  value?: number | string;
  compositeLogic?: 'AND' | 'OR';
  subConditions?: TriggerConditionConfig[];
}

export interface TriggerActionConfig {
  type: TriggerAction;
  targetId: string;       // ID do componente afetado
  value?: number | string;
  params?: Record<string, unknown>; // Parâmetros específicos da ação
  description?: string;
}

// ============================================================================
// UNIVERSAL CHARACTER SHEET (Agregador)
// ============================================================================
/**
 * A ficha universal agrega todos os componentes atômicos.
 * Cada sistema de RPG mapeia seus conceitos para estes componentes.
 * 
 * Exemplo: Em D&D 5e:
 * - Attributes -> Gauges (category: 'stat')
 * - HP -> Gauge (category: 'resource')
 * - Skills -> Gauges (category: 'skill')
 * - Feats -> FuzzyGauge (type: 'feats')
 * - Attack Roll -> DieRollConfig
 * - Critical Table -> LookupTable
 * - Death Save -> Contest (extended)
 * - "HP = 0 triggers Death Saves" -> TriggerNode
 */

export interface UniversalCharacterSheet {
  // Metadados da ficha
  meta: SheetMeta;
  
  // Componentes atômicos
  gauges: Gauge[];
  dieRolls: DieRollConfig[];
  decks: CardDeck[];
  fuzzyGauges: FuzzyGauge[];
  lookupTables: LookupTable[];
  contests: Contest[];
  triggers: TriggerNode[];
}

export interface SheetMeta {
  systemName: string;        // Ex: "D&D 5e", "Vampire: The Masquerade"
  systemVersion?: string;
  characterName: string;
  playerName?: string;
  sessionName?: string;
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  schemaVersion: string;     // Versão do schema para migração
  tags?: string[];           // Tags para organização
  customFields?: Record<string, unknown>; // Campos extras do sistema
}

// ============================================================================
// ENGINE TYPES (Para o Rule Engine)
// ============================================================================

export interface EngineState {
  sheet: UniversalCharacterSheet;
  history: EngineAction[];
  log: string[];
}

export interface EngineAction {
  id: string;
  type: 'gauge_update' | 'die_roll' | 'card_draw' | 'table_lookup' | 'contest' | 'trigger';
  timestamp: string;
  input: unknown;
  output: unknown;
}

export interface GaugeUpdateResult {
  gaugeId: string;
  previousValue: number;
  newValue: number;
  delta: number;
  triggersFired: string[]; // IDs de triggers ativados
}

export interface CardDrawResult {
  deckId: string;
  card: Card;
  remainingInDeck: number;
  shouldReshuffle: boolean;
}

export interface TableLookupResult {
  tableId: string;
  inputValue: string | number;
  matchedEntry: TableEntry | null;
  defaultUsed: boolean;
}

export interface ContestResult {
  contestId: string;
  resolution: ContestResolution;
  triggersFired: string[];
}
