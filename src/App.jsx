import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import playersData from './data/players.json'
import backgroundVideo from './assets/background.mp4'
import './App.css'

const classIcons = import.meta.glob('./assets/classes/*.png', { eager: true, import: 'default' })
const classIconMap = Object.fromEntries(
  Object.entries(classIcons).map(([path, src]) => {
    const key = path.split('/').pop()?.replace('.png', '')
    return [key, src]
  })
)

const classKeyMap = {
  cra: 'cra',
  eca: 'eca',
  ecaflip: 'eca',
  elio: 'elio',
  eniripsa: 'eni',
  eni: 'eni',
  enutrof: 'enu',
  enu: 'enu',
  feca: 'feca',
  forge: 'forge',
  forgelance: 'forge',
  hupper: 'hupper',
  huppermage: 'hupper',
  iop: 'iop',
  osa: 'osa',
  ouginak: 'ougi',
  panda: 'panda',
  pandawa: 'panda',
  roub: 'roub',
  roublard: 'roub',
  sacri: 'sacri',
  sacrieur: 'sacri',
  sadida: 'sadi',
  sadi: 'sadi',
  sram: 'sram',
  steamer: 'steamer',
  xelor: 'xelor',
  zobal: 'zobal'
}

const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const normalizeKey = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const resolveClassIcon = (name) => {
  if (!name) return null
  const key = classKeyMap[normalizeKey(String(name))]
  return key ? classIconMap[key] ?? null : null
}

const resolvePlayerPoints = (players, tournament) => {
  const playerNames = new Set(players.map((player) => player.name))
  const pointsByName = new Map(players.map((player) => [player.name, 0]))
  const bracketCollections = [tournament?.bracket, tournament?.losers_bracket, tournament?.losersBracket]
  const rounds = bracketCollections.flatMap((bracket) => Object.values(bracket ?? {}))

  for (const matches of rounds) {
    if (!Array.isArray(matches)) continue
    for (const match of matches) {
      const winner = match?.winner
      if (!playerNames.has(winner)) continue
      pointsByName.set(winner, (pointsByName.get(winner) ?? 0) + 1)
    }
  }

  return pointsByName
}

function App() {
  const participantCount = Array.isArray(playersData.players) ? playersData.players.length : 0

  return (
    <div className="app">
      <div className="video-bg" aria-hidden="true">
        <video autoPlay loop muted playsInline>
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="video-overlay" />
      </div>
      <header className="hero">
        <div>
          <p className="eyebrow">Dofus - Tournoi Ombre - PvP 2v2</p>
          <h1>Classement des joueurs</h1>
          <p className="subtitle">
            Edition III - {participantCount} participants. <br />1 point pour une victoire, 0 pour une defaite.
          </p>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Classement
          </NavLink>
          <NavLink to="/bracket">Bracket</NavLink>
          <NavLink to="/rules">Regles</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<RankingPage />} />
          <Route path="/bracket" element={<BracketPage />} />
          <Route path="/rules" element={<RulesPage />} />
        </Routes>
      </main>
      <footer className="footer">Developed by Skrys.</footer>
    </div>
  )
}

function RankingPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query.trim())
  const lastUpdated = playersData.lastUpdated

  const rankedPlayers = useMemo(() => {
    const pointsByName = resolvePlayerPoints(playersData.players, playersData.tournament)
    const list = playersData.players
      .map((player) => ({ ...player, points: pointsByName.get(player.name) ?? 0 }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return a.name.localeCompare(b.name)
      })

    let previousPoints = null
    let currentRank = 0

    const ranked = list.map((player, index) => {
      if (player.points !== previousPoints) {
        currentRank = index + 1
        previousPoints = player.points
      }
      return { ...player, rank: currentRank }
    })

    if (!normalizedQuery) return ranked
    return ranked.filter((player) => normalize(player.name).includes(normalizedQuery))
  }, [normalizedQuery])

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Classement actuel</h2>
          {lastUpdated ? <p className="last-updated">Derniere mise a jour: {lastUpdated}</p> : null}
        </div>
        <div className="search">
          <label htmlFor="player-search">Rechercher un joueur</label>
          <input
            id="player-search"
            type="search"
            placeholder="Ex: Skrys"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="ranking-table">
        <table>
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-classes">Classes</th>
              <th className="col-player">Joueur</th>
              <th className="col-points">Points</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((player, index) => (
              <PlayerRow key={player.name} player={player} order={index + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PlayerRow({ player, order }) {
  return (
    <tr className="player-row" style={{ '--i': order }}>
      <td className="cell-rank">#{player.rank}</td>
      <td className="cell-classes">
        <div className="player-classes" aria-label="Classes jouees">
          {Array.isArray(player.classes) && player.classes.length > 0 ? (
            player.classes.map((className, index) => {
              const iconSrc = resolveClassIcon(className)
              return (
                <span key={`${player.name}-class-${index}`} className="player-class">
                  {iconSrc ? <img src={iconSrc} alt={className} title={className} /> : <span>{className}</span>}
                </span>
              )
            })
          ) : (
            <span className="player-meta">Aucune classe</span>
          )}
        </div>
      </td>
      <td className="cell-player">
        <div className="player-name">{player.name}</div>
      </td>
      <td className="cell-points">{player.points}</td>
    </tr>
  )
}

const formatRoundLabel = (roundKey) => {
  const labels = {
    round_of_64: 'Round of 64',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarterfinals: 'Quarterfinals',
    semifinals: 'Semifinals',
    final: 'Final',
    losers_round_1: 'Losers Round 1',
    losers_round_2: 'Losers Round 2',
    losers_semifinals: 'Losers Semifinals',
    losers_final: 'Losers Final',
    grand_final: 'Grand Final',
    grand_final_reset: 'Grand Final Reset'
  }
  return labels[roundKey] ?? roundKey.replaceAll('_', ' ')
}

const resolveOrderedRounds = (bracket) => {
  const roundOrder = {
    round_of_64: 1,
    round_of_32: 2,
    round_of_16: 3,
    quarterfinals: 4,
    semifinals: 5,
    final: 6,
    grand_final: 7,
    grand_final_reset: 8,
    losers_round_1: 1,
    losers_round_2: 2,
    losers_semifinals: 3,
    losers_final: 4,
    losers_grand_final: 5
  }

  return Object.entries(bracket ?? {})
    .filter(([, matches]) => Array.isArray(matches) && matches.length > 0)
    .sort((a, b) => {
      const orderA = roundOrder[a[0]]
      const orderB = roundOrder[b[0]]
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB
      if (orderA !== undefined) return -1
      if (orderB !== undefined) return 1
      return a[0].localeCompare(b[0])
    })
}

const resolvePlayersByName = (players) => {
  return new Map(
    (players ?? []).map((player) => [player.name, Array.isArray(player.classes) ? player.classes : []])
  )
}

const BRACKET_CARD_HEIGHT = 82
const BRACKET_BASE_GAP = 14

const resolveRoundLayout = (roundIndex) => {
  const centerDistance = (BRACKET_CARD_HEIGHT + BRACKET_BASE_GAP) * 2 ** roundIndex
  const gap = Math.max(centerDistance - BRACKET_CARD_HEIGHT, BRACKET_BASE_GAP)
  const offset = Math.max(centerDistance / 2 - BRACKET_CARD_HEIGHT / 2, 0)
  return { gap, offset }
}

const resolveLayoutRoundIndex = (bracketType, roundIndex, roundKey) => {
  let layoutRoundIndex = roundIndex
  if (bracketType === 'losers' && roundIndex > 0) {
    // Keep losers_round_1 and losers_round_2 aligned, then compact following rounds.
    layoutRoundIndex = roundIndex - 1
  }
  if (roundKey === 'losers_grand_final' && layoutRoundIndex > 0) {
    layoutRoundIndex -= 1
  }
  return layoutRoundIndex
}

const resolveTeamScores = (score) => {
  if (typeof score !== 'string') return [null, null]
  const [teamAScore, teamBScore] = score.split('-').map((part) => part?.trim())
  const parsedA = Number.parseInt(teamAScore, 10)
  const parsedB = Number.parseInt(teamBScore, 10)
  return [Number.isNaN(parsedA) ? null : parsedA, Number.isNaN(parsedB) ? null : parsedB]
}

function MatchTeam({
  name,
  isWinner,
  classes,
  score,
  hasIncomingLink,
  hasCrossBracketIncoming,
  isHighlighted,
  hasPromotionPath,
  onHover,
  onLeave
}) {
  const rowClass = `match-team ${isWinner ? 'winner' : ''}`.trim()

  return (
    <div
      className={rowClass}
      data-outcome={isWinner ? 'win' : 'lose'}
      data-incoming={hasIncomingLink ? 'true' : 'false'}
      data-cross-incoming={hasCrossBracketIncoming ? 'true' : 'false'}
      data-highlighted={isHighlighted ? 'true' : 'false'}
      data-promote={hasPromotionPath ? 'true' : 'false'}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className='match-team-marker'/>

      <div className="match-team-classes" aria-label={`Classes de ${name}`}>
        {Array.isArray(classes) && classes.length > 0 ? (
          classes.map((className, index) => {
            const iconSrc = resolveClassIcon(className)
            return (
              <span key={`${name}-bracket-class-${index}`} className="match-class-badge">
                {iconSrc ? <img src={iconSrc} alt={className} title={className} /> : <span>{className}</span>}
              </span>
            )
          })
        ) : (
          <span className="match-team-meta">Aucune classe</span>
        )}
      </div>
      <span className="match-team-name">{name}</span>
      {score !== null ? <span className="match-team-score">{score}</span> : null}
      {isWinner ? <span className="match-win-arrow" aria-hidden="true" /> : null}
    </div>
  )
}

function MatchCard({
  match,
  playersByName,
  hasIncomingTopLink,
  hasIncomingBottomLink,
  hasCrossBracketIncomingTop,
  hasCrossBracketIncomingBottom,
  roundIndex,
  roundKey,
  hasNextRound,
  hoveredTeam,
  onHoverTeam,
  onLeaveTeam
}) {
  const teamA = match.teamA ?? 'TBD'
  const teamB = match.teamB ?? 'TBD'
  const [teamAScore, teamBScore] = resolveTeamScores(match.score)
  const topHighlighted = hoveredTeam !== null && hoveredTeam === teamA
  const bottomHighlighted = hoveredTeam !== null && hoveredTeam === teamB
  const outgoingHighlighted = hoveredTeam !== null && hoveredTeam === match.winner
  const hasPromotionPathOnTop = roundKey === 'losers_grand_final' && match.winner === teamA
  const hasPromotionPathOnBottom = roundKey === 'losers_grand_final' && match.winner === teamB

  return (
    <article
      className="match-card"
      data-round-index={roundIndex}
      data-has-outgoing={hasNextRound && Boolean(match.winner) ? 'true' : 'false'}
      data-highlight-top={topHighlighted ? 'true' : 'false'}
      data-highlight-bottom={bottomHighlighted ? 'true' : 'false'}
      data-highlight-outgoing={outgoingHighlighted ? 'true' : 'false'}
    >
      <MatchTeam
        name={teamA}
        isWinner={match.winner === teamA}
        classes={playersByName.get(teamA)}
        score={teamAScore}
        hasIncomingLink={hasIncomingTopLink}
        hasCrossBracketIncoming={hasCrossBracketIncomingTop}
        isHighlighted={topHighlighted}
        hasPromotionPath={hasPromotionPathOnTop}
        onHover={() => onHoverTeam(teamA)}
        onLeave={onLeaveTeam}
      />
      <MatchTeam
        name={teamB}
        isWinner={match.winner === teamB}
        classes={playersByName.get(teamB)}
        score={teamBScore}
        hasIncomingLink={hasIncomingBottomLink}
        hasCrossBracketIncoming={hasCrossBracketIncomingBottom}
        isHighlighted={bottomHighlighted}
        hasPromotionPath={hasPromotionPathOnBottom}
        onHover={() => onHoverTeam(teamB)}
        onLeave={onLeaveTeam}
      />
    </article>
  )
}

function BracketTree({
  title,
  rounds,
  playersByName,
  hoveredTeam,
  onHoverTeam,
  onLeaveTeam,
  showPromotionRail,
  bracketType
}) {
  const resolveIncomingLink = (roundIndex, previousRoundWinners, teamName, incomingOverride) => {
    if (typeof incomingOverride === 'boolean') return incomingOverride
    if (roundIndex === 0 || !teamName) return false
    return previousRoundWinners.has(teamName)
  }

  return (
    <section
      className="bracket-section"
      data-promotion-up={showPromotionRail ? 'true' : 'false'}
      data-bracket-type={bracketType}
    >
      <h3 className="bracket-section-title">{title}</h3>
      <div className="tree-wrap" role="region" aria-label={title}>
        <div className="bracket-grid">
          {rounds.map((round, roundIndex) => {
            const previousRound = roundIndex > 0 ? rounds[roundIndex - 1] : null
            const layoutRoundIndex = resolveLayoutRoundIndex(bracketType, roundIndex, round.key)
            const previousLayoutRoundIndex =
              previousRound ? resolveLayoutRoundIndex(bracketType, roundIndex - 1, previousRound.key) : null
            let layout = resolveRoundLayout(layoutRoundIndex)

            const isLosersFinalBetweenThreeSemifinals =
              bracketType === 'losers' &&
              round.key === 'losers_final' &&
              Array.isArray(round.matches) &&
              round.matches.length === 2 &&
              Array.isArray(previousRound?.matches) &&
              previousRound.matches.length === 3 &&
              previousLayoutRoundIndex !== null

            if (isLosersFinalBetweenThreeSemifinals) {
              const previousLayout = resolveRoundLayout(previousLayoutRoundIndex)
              const previousCenterDistance = BRACKET_CARD_HEIGHT + previousLayout.gap
              layout = {
                gap: previousLayout.gap,
                offset: previousLayout.offset + previousCenterDistance / 2
              }
            }
            const hasNextRound = roundIndex < rounds.length - 1
            const isPromotionColumn = showPromotionRail && roundIndex === rounds.length - 1
            const promotionWinner =
              isPromotionColumn && round.key === 'losers_grand_final' ? round.matches?.[0]?.winner ?? null : null
            const isPromotionHighlighted = Boolean(promotionWinner && hoveredTeam === promotionWinner)
            const previousRoundWinners = new Set(
              (previousRound?.matches ?? []).map((previousMatch) => previousMatch?.winner).filter(Boolean)
            )
            return (
              <section
                key={round.key}
                className="round-column"
                data-round-key={round.key}
                data-promotion-up={isPromotionColumn ? 'true' : 'false'}
                data-promotion-highlighted={isPromotionHighlighted ? 'true' : 'false'}
              >
                <h4 className="round-title">{formatRoundLabel(round.key)}</h4>
                <div
                  className="round-matches"
                  style={{ '--round-gap': `${layout.gap}px`, '--round-offset': `${layout.offset}px` }}
                >
                  {round.matches.map((match) => (
                    (() => {
                      const isGrandFinalRound = round.key === 'grand_final'
                      const isLosersBracketRound = bracketType === 'losers' && roundIndex > 0
                      const topCrossBracketIncomingFromGrandFinal =
                        isGrandFinalRound && roundIndex > 0 && Boolean(match.teamA) && !previousRoundWinners.has(match.teamA)
                      const bottomCrossBracketIncomingFromGrandFinal =
                        isGrandFinalRound && roundIndex > 0 && Boolean(match.teamB) && !previousRoundWinners.has(match.teamB)
                      const topIncomingFromOutsideLosersRound =
                        isLosersBracketRound && Boolean(match.teamA) && !previousRoundWinners.has(match.teamA)
                      const bottomIncomingFromOutsideLosersRound =
                        isLosersBracketRound && Boolean(match.teamB) && !previousRoundWinners.has(match.teamB)
                      const hasIncomingTopLink = resolveIncomingLink(
                        roundIndex,
                        previousRoundWinners,
                        match.teamA,
                        match.incomingTopFromPrevious
                      ) || topCrossBracketIncomingFromGrandFinal || topIncomingFromOutsideLosersRound
                      const hasIncomingBottomLink = resolveIncomingLink(
                        roundIndex,
                        previousRoundWinners,
                        match.teamB,
                        match.incomingBottomFromPrevious
                      ) || bottomCrossBracketIncomingFromGrandFinal || bottomIncomingFromOutsideLosersRound

                      return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      playersByName={playersByName}
                      hasIncomingTopLink={hasIncomingTopLink}
                      hasIncomingBottomLink={hasIncomingBottomLink}
                      hasCrossBracketIncomingTop={topCrossBracketIncomingFromGrandFinal}
                      hasCrossBracketIncomingBottom={bottomCrossBracketIncomingFromGrandFinal}
                      roundIndex={roundIndex}
                      roundKey={round.key}
                      hasNextRound={hasNextRound}
                      hoveredTeam={hoveredTeam}
                      onHoverTeam={onHoverTeam}
                      onLeaveTeam={onLeaveTeam}
                    />
                      )
                    })()
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function BracketPage() {
  const tournament = playersData?.tournament ?? {}
  const winnersRoundsBase = resolveOrderedRounds(playersData?.tournament?.bracket).map(([key, matches]) => ({ key, matches }))
  const losersRounds = resolveOrderedRounds(
    playersData?.tournament?.losers_bracket ?? playersData?.tournament?.losersBracket
  ).map(([key, matches]) => ({ key, matches }))
  const playersByName = useMemo(() => resolvePlayersByName(playersData?.players), [])
  const champion = tournament?.champion
  const losersChampion = tournament?.losers_champion ?? tournament?.losersChampion
  const grandFinalMatches = Array.isArray(tournament?.grand_final)
    ? tournament.grand_final
    : champion && losersChampion
      ? [
          {
            id: 'grand-final-m1',
            teamA: champion,
            teamB: losersChampion,
            winner: champion
          }
        ]
      : []
  const grandFinalRounds = grandFinalMatches.length > 0 ? [{ key: 'grand_final', matches: grandFinalMatches }] : []
  const winnersRounds = [...winnersRoundsBase, ...grandFinalRounds]
  const [hoveredTeam, setHoveredTeam] = useState(null)
  const hasAnyBracket = winnersRounds.length > 0 || losersRounds.length > 0

  return (
    <section className="page bracket-page">
      <div className="section-header">
        <div>
          <h2>Bracket du tournoi</h2>
          {champion ? <p className="last-updated">Champion du winner bracket: {champion}</p> : null}
          {losersChampion ? <p className="last-updated">Champion du loser bracket: {losersChampion}</p> : null}
        </div>
      </div>

      {!hasAnyBracket ? (
        <div className="rules-card">
          <p>Aucun bracket disponible dans les donnees.</p>
        </div>
      ) : (
        <div className="bracket-stack">
          {winnersRounds.length > 0 ? (
            <BracketTree
              title="Winner Bracket"
              rounds={winnersRounds}
              playersByName={playersByName}
              hoveredTeam={hoveredTeam}
              onHoverTeam={setHoveredTeam}
              onLeaveTeam={() => setHoveredTeam(null)}
              showPromotionRail={false}
              bracketType="winners"
            />
          ) : null}
          {losersRounds.length > 0 ? (
            <>
              {grandFinalRounds.length > 0 ? (
                <div className="bracket-bridge" aria-hidden="true">
                  <span className="bracket-bridge-label">Loser bracket winner remonte en grand final</span>
                </div>
              ) : null}
            <BracketTree
              title="Loser Bracket"
              rounds={losersRounds}
              playersByName={playersByName}
              hoveredTeam={hoveredTeam}
              onHoverTeam={setHoveredTeam}
              onLeaveTeam={() => setHoveredTeam(null)}
              showPromotionRail={grandFinalRounds.length > 0}
              bracketType="losers"
            />
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}

function RulesPage() {
  return (
    <section className="page rules">
      <div className="rules-card">
        <h2>Reglement du tournoi PvP</h2>

        <h3>1) Les classes</h3>
        <p>Chaque classe vaut des points selon le systeme suivant :</p>
        <ul>
          <li>5 points : Osamodas</li>
          <li>4 points : Huppermage, Xelor et Ecaflip</li>
          <li>3,5 points : Eniripsa, Sadida et Forgelance</li>
          <li>3 points : Iop, Zobal, Steamer, Eliotrope, Sacrieur, Panda et Ouginak</li>
          <li>2,5 points : Feca</li>
          <li>2 points : Enutrof, Sram, Cra et Roublard</li>
        </ul>
        <p>La somme des points de l'equipe doit etre de 6 maximum.</p>
        <p>
          La valeur de chaque classe a ete determinee par le comite strategique compose de Coach Shangai,
          Ryk, Shura et Nde.
        </p>
        <p>Avec la beta, il est possible qu'Ankama distribue encore quelques up ou nerfs.</p>

        <h3>2) Limitations d'equipement</h3>
        <p>Certains objets sont proscrits du fait de leur rarete/prix sur le serveur Ombre :</p>
        <ul>
          <li>Dofus interdits : Ebene, Ivoire, Vulbis, Tachete, Forgelave, Cauchemar, Nebuleux et Sylvestre.</li>
          <li>Gargandias : panoplie et corps a corps autorises, mais pas en degats neutres.</li>
          <li>Botte Meriana : exclue.</li>
        </ul>
        <p>Vous avez le droit de changer d'equipement a chaque combat.</p>
        <ul>
          <li>Les limitations de retraits PA ou PM sont fixees a 85 maximum.</li>
          <li>Vous ne pouvez pas utiliser de trophee, familier ou monture donnant des do-pou.</li>
          <li>Les items legendaires et familiers legendaires sont autorises. (Toutes les dragodindes, Muldo et Volk sont up)</li>
        </ul>

        <h3>3) Regles generales</h3>
        <ul>
          <li>A partir du 16eme tour, le premier coup fatal determine le vainqueur.</li>
          <li>A partir du 21eme tour, l'equipe qui possede le plus de HP gagne.</li>
          <li>Vous avez le droit de jouer des stuffs ou equipements pretes pour l'occasion.</li>
          <li>Il y a une tolerance de 5 minutes de retard, sinon c'est disqualifie.</li>
          <li>
            Si vous pensez que vos adversaires ne respectent pas une regle, vous pouvez demander un screen
            de leur stuff avec le combat en arriere-plan pendant le combat. Ils devront partager le screen
            sur Discord avant la fin du match.
          </li>
          <li>Si vous trouvez les regles trop contraignantes, vous pouvez jouer une compo lvl 180 MAX sans aucune restriction.</li>
        </ul>
      </div>
    </section>
  )
}

export default App
