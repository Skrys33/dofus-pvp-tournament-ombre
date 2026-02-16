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
  const rounds = Object.values(tournament?.bracket ?? {})

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
          <p className="eyebrow">Dofus - Tournoi Ombre - PvP</p>
          <h1>Classement des joueurs</h1>
          <p className="subtitle">
            Classement base sur le tournoi. <br />1 point pour une victoire, 0 pour une defaite.
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
              <th className="col-player">Joueur</th>
              <th className="col-classes">Classes</th>
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
      <td className="cell-player">
        <div className="player-name">{player.name}</div>
      </td>
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
    final: 'Final'
  }
  return labels[roundKey] ?? roundKey.replaceAll('_', ' ')
}

const resolveOrderedRounds = (bracket) => {
  return Object.entries(bracket ?? {})
    .filter(([, matches]) => Array.isArray(matches) && matches.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
}

const resolveBracketRoots = (bracket) => {
  const orderedRounds = resolveOrderedRounds(bracket).map(([key, matches]) => ({ key, matches }))
  if (orderedRounds.length === 0) return []

  const buildNode = (roundIndex, matchIndex) => {
    const round = orderedRounds[roundIndex]
    const match = round?.matches?.[matchIndex]
    if (!match) return null

    const node = {
      id: `${round.key}-${matchIndex}`,
      label: match.winner ?? 'TBD',
      subtitle: `${formatRoundLabel(round.key)}${match.score ? ` - ${match.score}` : ''}`,
      isWinner: true,
      isLeaf: false,
      children: []
    }

    if (roundIndex === 0) {
      node.children = [
        {
          id: `${node.id}-a`,
          label: match.teamA ?? 'TBD',
          isWinner: match.winner === match.teamA,
          isLeaf: true
        },
        {
          id: `${node.id}-b`,
          label: match.teamB ?? 'TBD',
          isWinner: match.winner === match.teamB,
          isLeaf: true
        }
      ]
      return node
    }

    const left = buildNode(roundIndex - 1, matchIndex * 2)
    const right = buildNode(roundIndex - 1, matchIndex * 2 + 1)

    node.children = [
      left ?? {
        id: `${node.id}-fallback-a`,
        label: match.teamA ?? 'TBD',
        isWinner: match.winner === match.teamA,
        isLeaf: true
      },
      right ?? {
        id: `${node.id}-fallback-b`,
        label: match.teamB ?? 'TBD',
        isWinner: match.winner === match.teamB,
        isLeaf: true
      }
    ]

    return node
  }

  const finalRoundIndex = orderedRounds.length - 1
  const finalMatches = orderedRounds[finalRoundIndex].matches
  return finalMatches.map((_, index) => buildNode(finalRoundIndex, index)).filter(Boolean)
}

function BracketNode({ node }) {
  const isBye = typeof node.label === 'string' && node.label.startsWith('BYE_')
  const cardClass = `tree-card ${node.isWinner ? 'winner' : ''} ${isBye ? 'bye' : ''}`.trim()

  return (
    <li>
      <div className={cardClass}>
        <span className="tree-label">{node.label}</span>
        {node.subtitle ? <span className="tree-meta">{node.subtitle}</span> : null}
      </div>
      {Array.isArray(node.children) && node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <BracketNode key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function BracketPage() {
  const roots = resolveBracketRoots(playersData?.tournament?.bracket)
  const champion = playersData?.tournament?.champion

  return (
    <section className="page bracket-page">
      <div className="section-header">
        <div>
          <h2>Bracket du tournoi</h2>
          {champion ? <p className="last-updated">Champion fictif: {champion}</p> : null}
        </div>
      </div>

      {roots.length === 0 ? (
        <div className="rules-card">
          <p>Aucun bracket disponible dans les donnees.</p>
        </div>
      ) : (
        <div className="tree-wrap" role="region" aria-label="Arbre de rencontres">
          <ul className="match-tree">
            {roots.map((root) => (
              <BracketNode key={root.id} node={root} />
            ))}
          </ul>
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
