

import { useEffect, useMemo, useState } from 'react'

import {
  getStartups, registerUser, loginUser,
  getMyStartups, createStartup, updateStartup, deleteStartup,
  getShortlist, addToShortlist, removeFromShortlist,
} from './api.js'



const INDUSTRIES = [

  'All industries',

  'FinTech',

  'CleanTech',

  'HealthTech',

  'EdTech',

  'Logistics',

  'PropTech',

]



const STAGES = [

  'All stages',

  'Pre-Seed',

  'Seed',

  'Series A',

  'Series B',

  'Series C',

  'Growth',

]



const COLOR_CLASSES = {

  violet: 'bg-violet-100 text-violet-700',

  emerald: 'bg-emerald-100 text-emerald-700',

  sky: 'bg-sky-100 text-sky-700',

  amber: 'bg-amber-100 text-amber-700',

  rose: 'bg-rose-100 text-rose-700',

  indigo: 'bg-indigo-100 text-indigo-700',

}



const formatFunding = (amount) =>

  new Intl.NumberFormat('en-US', {

    style: 'currency',

    currency: 'USD',

    maximumFractionDigits: 0,

  }).format(Number(amount) || 0)



function normalizeStartup(item) {

  const companyName = item.companyName || item.name || 'Startup'

  const initials = companyName

    .split(/\s+/)

    .map((word) => word[0])

    .join('')

    .slice(0, 2)

    .toUpperCase()



  return {

    id: item._id || item.id,

    name: companyName,

    tagline: item.tagline || 'Building something innovative.',

    description: item.description || 'No description available yet.',

    industry: item.industry || 'Other',

    stage: item.fundingStage || item.stage || 'Pre-Seed',

    funding: item.fundingRequired ?? item.funding ?? 0,

    location: item.location || 'Location not specified',

    website: item.website || '',

    initials,

    color: 'indigo',

  }

}



function App() {

  const [search, setSearch] = useState('')

  const [industry, setIndustry] = useState('All industries')

  const [stage, setStage] = useState('All stages')

  const [selectedStartup, setSelectedStartup] = useState(null)

  const [savedIds, setSavedIds] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('startupfund_user') || 'null') }
    catch { return null }
  })
  const [myStartupIds, setMyStartupIds] = useState([])
  const [startupModalMode, setStartupModalMode] = useState(null)
  const [startupSubmitting, setStartupSubmitting] = useState(false)
  const [startupFormError, setStartupFormError] = useState('')
  const [startupForm, setStartupForm] = useState({
    companyName: '', tagline: '', description: '', industry: 'FinTech',
    fundingStage: 'Pre-Seed', fundingRequired: '', location: '', website: '',
  })

  const [notice, setNotice] = useState('')

  const [authMode, setAuthMode] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'founder' })




  const [startups, setStartups] = useState([])

  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState('')



  useEffect(() => {

    let cancelled = false



    async function loadStartups() {

      try {

        setLoading(true)

        setApiError('')



        const data = await getStartups()



        if (!cancelled) {

          setStartups((data.startups || []).map(normalizeStartup))

        }

      } catch (error) {

        if (!cancelled) {

          setApiError(

            error.message || 'Unable to load startups. Please try again.'

          )

        }

      } finally {

        if (!cancelled) {

          setLoading(false)

        }

      }

    }



    loadStartups()



    return () => {

      cancelled = true

    }

  }, [])



  const filteredStartups = useMemo(() => {

    const term = search.trim().toLowerCase()



    return startups.filter((startup) => {

      const searchableText = [

        startup.name,

        startup.tagline,

        startup.description,

        startup.industry,

        startup.location,

      ]

        .join(' ')

        .toLowerCase()



      const matchesSearch = searchableText.includes(term)

      const matchesIndustry =

        industry === 'All industries' || startup.industry === industry

      const matchesStage =

        stage === 'All stages' || startup.stage === stage



      return matchesSearch && matchesIndustry && matchesStage

    })

  }, [startups, search, industry, stage])



  function showNotice(message) {

    setNotice(message)

    window.setTimeout(() => setNotice(''), 3500)

  }



  async function refreshStartups() {
    const data = await getStartups()
    setStartups((data.startups || []).map(normalizeStartup))
  }

  async function toggleSaved(id) {
    if (!currentUser) {
      showNotice('Please log in as an investor to save startups.')
      openAuth('login')
      return
    }
    if (currentUser.role !== 'investor') {
      showNotice('Only investor accounts can shortlist startups.')
      return
    }

    try {
      if (savedIds.includes(id)) {
        await removeFromShortlist(id)
        setSavedIds((previous) => previous.filter((savedId) => savedId !== id))
        showNotice('Startup removed from your shortlist.')
      } else {
        await addToShortlist(id)
        setSavedIds((previous) => previous.includes(id) ? previous : [...previous, id])
        showNotice('Startup saved to your shortlist.')
      }
    } catch (error) {
      showNotice(error.message || 'Unable to update shortlist.')
    }
  }

  function openStartupForm(startup = null) {
    setStartupFormError('')
    setStartupModalMode(startup ? 'edit' : 'create')
    setStartupForm(startup ? {
      companyName: startup.name || '',
      tagline: startup.tagline || '',
      description: startup.description || '',
      industry: startup.industry || 'FinTech',
      fundingStage: startup.stage || 'Pre-Seed',
      fundingRequired: String(startup.funding ?? ''),
      location: startup.location || '',
      website: startup.website || '',
      id: startup.id,
    } : {
      companyName: '', tagline: '', description: '', industry: 'FinTech',
      fundingStage: 'Pre-Seed', fundingRequired: '', location: '', website: '',
    })
  }

  async function handleStartupSubmit(event) {
    event.preventDefault()
    setStartupSubmitting(true)
    setStartupFormError('')
    const payload = {
      companyName: startupForm.companyName.trim(),
      tagline: startupForm.tagline.trim(),
      description: startupForm.description.trim(),
      industry: startupForm.industry,
      fundingStage: startupForm.fundingStage,
      fundingRequired: Number(startupForm.fundingRequired),
      location: startupForm.location.trim(),
      website: startupForm.website.trim(),
    }

    try {
      if (startupModalMode === 'edit') {
        await updateStartup(startupForm.id, payload)
        showNotice('Startup profile updated successfully.')
      } else {
        await createStartup(payload)
        showNotice('Startup profile created successfully.')
      }
      await refreshStartups()
      const mine = await getMyStartups()
      setMyStartupIds((mine.startups || []).map((item) => item._id))
      setStartupModalMode(null)
    } catch (error) {
      setStartupFormError(error.message || 'Unable to save startup profile.')
    } finally {
      setStartupSubmitting(false)
    }
  }

  async function handleDeleteStartup(id) {
    const confirmed = window.confirm('Delete this startup profile? This cannot be undone.')
    if (!confirmed) return
    try {
      await deleteStartup(id)
      setStartups((previous) => previous.filter((startup) => startup.id !== id))
      setMyStartupIds((previous) => previous.filter((startupId) => startupId !== id))
      setSavedIds((previous) => previous.filter((startupId) => startupId !== id))
      showNotice('Startup profile deleted successfully.')
    } catch (error) {
      showNotice(error.message || 'Unable to delete startup profile.')
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadRoleData() {
      if (!currentUser || !localStorage.getItem('startupfund_token')) {
        setSavedIds([])
        setMyStartupIds([])
        return
      }
      try {
        if (currentUser.role === 'investor') {
          const data = await getShortlist()
          if (!cancelled) setSavedIds((data.shortlist || []).map((item) => item.startup?._id).filter(Boolean))
          setMyStartupIds([])
        } else if (currentUser.role === 'founder') {
          const data = await getMyStartups()
          if (!cancelled) setMyStartupIds((data.startups || []).map((item) => item._id))
          setSavedIds([])
        }
      } catch (error) {
        if (!cancelled) showNotice(error.message || 'Unable to load your saved data.')
      }
    }
    loadRoleData()
    return () => { cancelled = true }
  }, [currentUser])

  function openAuth(mode) {
    setAuthMode(mode)
    setAuthError('')
    setAuthSuccess('')
    setAuthForm((previous) => ({ ...previous, name: '', password: '', role: 'founder' }))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    try {
      const payload = authMode === 'register'
        ? authForm
        : { email: authForm.email, password: authForm.password }
      const result = authMode === 'register'
        ? await registerUser(payload)
        : await loginUser(payload)

      if (result.token) localStorage.setItem('startupfund_token', result.token)
      if (result.user) {
        localStorage.setItem('startupfund_user', JSON.stringify(result.user))
        if (authMode === 'login') setCurrentUser(result.user)
      }

      setAuthSuccess(authMode === 'register'
        ? 'Account created successfully! You can now log in.'
        : 'You are now logged in successfully.')
      if (authMode === 'register') {
        setTimeout(() => openAuth('login'), 900)
      } else {
        setTimeout(() => {
          setAuthMode(null)
          setAuthSuccess('')
        }, 900)
      }
    } catch (error) {
      setAuthError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  function clearFilters() {

    setSearch('')

    setIndustry('All industries')

    setStage('All stages')

  }



  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navigation */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">

          <a href="#home" className="flex shrink-0 items-center gap-2.5">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-200">

              S

            </span>

            <span className="text-xl font-extrabold tracking-tight">

              Startup<span className="text-indigo-600">Fund</span>

            </span>

          </a>



          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">

            <a className="transition hover:text-indigo-600" href="#discover">

              Discover

            </a>

            <a

              className="transition hover:text-indigo-600"

              href="#how-it-works"

            >

              How it works

            </a>

            <a

              className="transition hover:text-indigo-600"

              href="#for-founders"

            >

              For founders

            </a>

          </div>



          <div className="flex items-center gap-2">

            <button

              onClick={() => openAuth('login')}

              className="rounded-xl px-3 py-2.5 text-sm font-bold transition hover:bg-slate-100 sm:px-4"

            >

              Log in

            </button>

            <button

              onClick={() => openAuth('register')}

              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:px-5"

            >

              Get started

            </button>

          </div>

        </nav>

      </header>



      <main id="home">

        {/* Hero */}

        <section className="relative isolate overflow-hidden bg-white">

          <div className="pointer-events-none absolute -right-32 -top-24 -z-10 h-96 w-96 rounded-full bg-indigo-200/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 left-0 -z-10 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />



          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:py-28">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">

                <span className="h-2 w-2 rounded-full bg-indigo-600" />

                Connecting founders with investors

              </div>



              <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">

                Your vision.

                <span className="block text-indigo-600">

                  Their investment.

                </span>

                A bigger future.

              </h1>



              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">

                Discover ambitious startups, explore funding opportunities and

                bring founders and investors closer together—all in one place.

              </p>



              <div className="mt-8 flex flex-wrap gap-3">

                <a

                  href="#discover"

                  className="rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"

                >

                  Explore startups <span aria-hidden="true">→</span>

                </a>

                <a

                  href="#for-founders"

                  className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold transition hover:border-indigo-300 hover:bg-indigo-50"

                >

                  I'm a founder

                </a>

              </div>



              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-200 pt-7">

                <div>

                  <p className="text-xl font-extrabold">Discover</p>

                  <p className="mt-1 text-sm text-slate-500">

                    Promising startups

                  </p>

                </div>

                <div>

                  <p className="text-xl font-extrabold">Connect</p>

                  <p className="mt-1 text-sm text-slate-500">

                    Founders &amp; investors

                  </p>

                </div>

                <div>

                  <p className="text-xl font-extrabold">Grow</p>

                  <p className="mt-1 text-sm text-slate-500">

                    Ideas into impact

                  </p>

                </div>

              </div>

            </div>



            {/* Featured opportunity */}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-2xl shadow-slate-200/70 sm:p-7">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-bold text-indigo-600">

                    FEATURED OPPORTUNITY

                  </p>

                  <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">

                    Meet your next opportunity

                  </h2>

                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">

                  Startup discovery

                </span>

              </div>



              {startups.length > 0 ? (

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-black text-indigo-700">

                      {startups[0].initials}

                    </div>

                    <div>

                      <h3 className="text-lg font-extrabold">

                        {startups[0].name}

                      </h3>

                      <p className="mt-1 text-sm text-slate-500">

                        {startups[0].industry} · {startups[0].stage} stage

                      </p>

                    </div>

                  </div>



                  <p className="mt-5 text-sm leading-7 text-slate-600">

                    {startups[0].tagline}

                  </p>



                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">

                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Funding requested

                      </p>

                      <p className="mt-1 text-xl font-black">

                        {formatFunding(startups[0].funding)}

                      </p>

                    </div>

                    <button

                      onClick={() => setSelectedStartup(startups[0])}

                      className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"

                    >

                      Explore profile ↗

                    </button>

                  </div>

                </div>

              ) : (

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700">

                    ✦

                  </div>

                  <h3 className="mt-4 text-lg font-extrabold">

                    Your next opportunity starts here

                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-600">

                    Startup profiles will appear here when founders publish

                    their information.

                  </p>

                  {loading && (

                    <p className="mt-3 text-sm text-indigo-600">

                      Loading opportunities...

                    </p>

                  )}

                </div>

              )}



              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">

                <span aria-hidden="true">✦</span>

                Built for the next generation of businesses

              </div>

            </div>

          </div>

        </section>



        {/* Discovery */}

        <section id="discover" className="scroll-mt-24 py-16 sm:py-20">

          <div className="mx-auto max-w-7xl px-5 sm:px-8">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

              <div>

                <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">

                  Discover opportunities

                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">

                  Startups to watch

                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-600">

                  Explore startup profiles, learn about their missions and

                  discover businesses that match your interests.

                </p>

              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-slate-500">
                  {loading ? 'Loading...' : `${filteredStartups.length} opportunities found`}
                </p>
                {currentUser?.role === 'founder' && (
                  <button type="button" onClick={() => openStartupForm()} className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700">
                    + Add startup
                  </button>
                )}
              </div>

            </div>



            {/* Search and filters */}

            <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">

              <label className="relative block sm:col-span-2 lg:col-span-1">

                <span className="sr-only">Search startups</span>

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">

                  ⌕

                </span>

                <input

                  type="search"

                  value={search}

                  onChange={(event) => setSearch(event.target.value)}

                  placeholder="Search startups, industries..."

                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                />

              </label>



              <label>

                <span className="sr-only">Filter by industry</span>

                <select

                  value={industry}

                  onChange={(event) => setIndustry(event.target.value)}

                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

                >

                  {INDUSTRIES.map((item) => (

                    <option key={item} value={item}>

                      {item}

                    </option>

                  ))}

                </select>

              </label>



              <label>

                <span className="sr-only">Filter by funding stage</span>

                <select

                  value={stage}

                  onChange={(event) => setStage(event.target.value)}

                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

                >

                  {STAGES.map((item) => (

                    <option key={item} value={item}>

                      {item}

                    </option>

                  ))}

                </select>

              </label>

            </div>



            {apiError && (

              <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

                <p className="font-bold">Unable to load startups</p>

                <p className="mt-1">{apiError}</p>

                <button

                  onClick={() => window.location.reload()}

                  className="mt-3 rounded-lg bg-red-100 px-4 py-2 font-bold hover:bg-red-200"

                >

                  Retry

                </button>

              </div>

            )}



            {loading && (

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">

                <p className="font-bold text-indigo-600">

                  Loading startups...

                </p>

                <p className="mt-2 text-sm text-slate-500">

                  Fetching the latest profiles from the database.

                </p>

              </div>

            )}



            {/* Startup cards */}

            {!loading && !apiError && filteredStartups.length > 0 && (

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {filteredStartups.map((startup) => {

                  const isSaved = savedIds.includes(startup.id)



                  return (

                    <article

                      key={startup.id}

                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60"

                    >

                      <div className="flex items-start justify-between gap-3">

                        <div

                          className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black ${

                            COLOR_CLASSES[startup.color] || COLOR_CLASSES.indigo

                          }`}

                        >

                          {startup.initials}

                        </div>



                        <button

                          type="button"

                          onClick={() => toggleSaved(startup.id)}

                          aria-label={

                            isSaved

                              ? `Remove ${startup.name} from shortlist`

                              : `Save ${startup.name} to shortlist`

                          }

                          title={

                            isSaved

                              ? 'Remove from shortlist'

                              : 'Add to shortlist'

                          }

                          className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${

                            isSaved

                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'

                              : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'

                          }`}

                        >

                          {isSaved ? '♥ Saved' : '♡ Save'}

                        </button>

                      </div>



                      <div className="mt-5 flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">

                          {startup.industry}

                        </span>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">

                          {startup.stage}

                        </span>

                      </div>



                      <h3 className="mt-4 text-xl font-extrabold">

                        {startup.name}

                      </h3>

                      <p className="mt-2 text-sm font-semibold text-slate-500">

                        {startup.tagline}

                      </p>

                      <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">

                        {startup.description}

                      </p>



                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <p className="text-xs font-medium text-slate-500">

                          Funding requested

                        </p>

                        <p className="mt-1 text-lg font-extrabold">

                          {formatFunding(startup.funding)}

                        </p>

                        <p className="mt-2 text-xs text-slate-500">

                          {startup.location}

                        </p>



                        <button

                          type="button"

                          onClick={() => setSelectedStartup(startup)}

                          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"

                        >

                          View startup details →

                        </button>

                        {currentUser?.role === 'founder' && myStartupIds.includes(startup.id) && (
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => openStartupForm(startup)} className="flex-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Edit</button>
                            <button type="button" onClick={() => handleDeleteStartup(startup.id)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button>
                          </div>
                        )}

                      </div>

                    </article>

                  )

                })}

              </div>

            )}



            {!loading && !apiError && filteredStartups.length === 0 && (

              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">

                  ✦

                </div>

                <p className="mt-4 text-lg font-extrabold">

                  {startups.length === 0

                    ? 'No startup profiles yet'

                    : 'No startups found'}

                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">

                  {startups.length === 0

                    ? 'When a founder creates a startup profile, it will appear here.'

                    : 'Try changing your search or filters.'}

                </p>

                {(search || industry !== 'All industries' || stage !== 'All stages') && (

                  <button

                    onClick={clearFilters}

                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"

                  >

                    Clear filters

                  </button>

                )}

              </div>

            )}



            {savedIds.length > 0 && (

              <div className="mt-7 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">

                <strong>{savedIds.length}</strong> startup

                {savedIds.length === 1 ? '' : 's'} saved to your temporary

                shortlist. startup saved to your shortlist.

              </div>

            )}

          </div>

        </section>



        {/* Founder call to action */}

        <section

          id="for-founders"

          className="scroll-mt-24 px-5 pb-16 sm:px-8 sm:pb-20"

        >

          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-indigo-700 px-6 py-12 text-white sm:px-12 sm:py-16">

            <div className="grid items-center gap-8 md:grid-cols-2">

              <div>

                <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-200">

                  For founders

                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">

                  Building something meaningful?

                </h2>

                <p className="mt-4 max-w-xl leading-7 text-indigo-100">

                  Create your startup profile, share your funding goals and

                  make it easier for interested investors to discover you.

                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row md:justify-end">

                <button

                  onClick={() => openAuth('register')}

                  className="rounded-xl bg-white px-6 py-3.5 font-extrabold text-indigo-700 transition hover:bg-indigo-50"

                >

                  Create a founder profile →

                </button>

                <a

                  href="#how-it-works"

                  className="rounded-xl border border-indigo-300 px-6 py-3.5 text-center font-bold text-white transition hover:bg-indigo-600"

                >

                  Learn more

                </a>

              </div>

            </div>

          </div>

        </section>



        {/* How it works */}

        <section

          id="how-it-works"

          className="scroll-mt-24 border-y border-slate-200 bg-white py-16 sm:py-20"

        >

          <div className="mx-auto max-w-7xl px-5 sm:px-8">

            <div className="mx-auto max-w-2xl text-center">

              <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">

                Simple by design

              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">

                From ideas to opportunities

              </h2>

              <p className="mt-4 leading-7 text-slate-600">

                A straightforward journey for founders and investors.

              </p>

            </div>



            <div className="mt-12 grid gap-8 md:grid-cols-3">

              {[

                {

                  number: '01',

                  title: 'Build your profile',

                  description:

                    'Founders share their startup, vision, industry and funding needs.',

                },

                {

                  number: '02',

                  title: 'Discover opportunities',

                  description:

                    'Investors explore startups by industry, stage and funding goals.',

                },

                {

                  number: '03',

                  title: 'Create connections',

                  description:

                    'Shortlist relevant opportunities and take the next step towards collaboration.',

                },

              ].map((item) => (

                <div

                  key={item.number}

                  className="rounded-2xl border border-slate-200 bg-slate-50 p-7"

                >

                  <span className="text-3xl font-black text-indigo-600">

                    {item.number}

                  </span>

                  <h3 className="mt-5 text-xl font-extrabold">

                    {item.title}

                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">

                    {item.description}

                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>

      </main>



      {/* Footer */}

      <footer className="bg-slate-950 text-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">

          <a href="#home" className="flex items-center gap-2 text-lg font-extrabold">

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm">

              S

            </span>

            StartupFund

          </a>

          <p className="text-sm text-slate-400">

            Connecting founders with investors.

          </p>

          <p className="text-sm text-slate-500">

            © {new Date().getFullYear()} StartupFund

          </p>

        </div>

      </footer>



      {/* Create / edit startup modal */}
      {startupModalMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="startup-form-title" className="my-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">Founder workspace</p>
                <h2 id="startup-form-title" className="mt-2 text-2xl font-black">{startupModalMode === 'edit' ? 'Edit startup profile' : 'Create startup profile'}</h2>
                <p className="mt-2 text-sm text-slate-500">Share accurate information so investors can understand your business.</p>
              </div>
              <button type="button" onClick={() => setStartupModalMode(null)} disabled={startupSubmitting} className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form onSubmit={handleStartupSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Company name
                <input required minLength={2} maxLength={100} value={startupForm.companyName} onChange={(e) => setStartupForm({ ...startupForm, companyName: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-500" placeholder="e.g. Green Future" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Industry
                <select required value={startupForm.industry} onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal">
                  {INDUSTRIES.filter((item) => item !== 'All industries').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Funding stage
                <select required value={startupForm.fundingStage} onChange={(e) => setStartupForm({ ...startupForm, fundingStage: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal">
                  {STAGES.filter((item) => item !== 'All stages').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Funding required (USD)
                <input required type="number" min="0" step="1" value={startupForm.fundingRequired} onChange={(e) => setStartupForm({ ...startupForm, fundingRequired: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" placeholder="50000" />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Tagline
                <input required maxLength={160} value={startupForm.tagline} onChange={(e) => setStartupForm({ ...startupForm, tagline: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" placeholder="One-line description of your startup" />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description
                <textarea required minLength={10} rows={4} value={startupForm.description} onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" placeholder="What problem does your startup solve?" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Location
                <input required value={startupForm.location} onChange={(e) => setStartupForm({ ...startupForm, location: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" placeholder="Delhi, India" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Website (optional)
                <input type="url" value={startupForm.website} onChange={(e) => setStartupForm({ ...startupForm, website: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" placeholder="https://example.com" />
              </label>
              {startupFormError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{startupFormError}</p>}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={startupSubmitting} onClick={() => setStartupModalMode(null)} className="rounded-xl border border-slate-200 px-5 py-3 font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={startupSubmitting} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{startupSubmitting ? 'Saving...' : startupModalMode === 'edit' ? 'Save changes' : 'Create startup'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Startup details modal */}

      {selectedStartup && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              setSelectedStartup(null)

            }

          }}

        >

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="startup-modal-title"

            className="my-auto w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"

          >

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-4">

                <div

                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black ${

                    COLOR_CLASSES[selectedStartup.color] || COLOR_CLASSES.indigo

                  }`}

                >

                  {selectedStartup.initials}

                </div>

                <div>

                  <h2

                    id="startup-modal-title"

                    className="text-2xl font-black"

                  >

                    {selectedStartup.name}

                  </h2>

                  <p className="mt-1 text-sm text-slate-500">

                    {selectedStartup.industry} · {selectedStartup.stage}

                  </p>

                </div>

              </div>



              <button

                type="button"

                onClick={() => setSelectedStartup(null)}

                aria-label="Close startup details"

                className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"

              >

                ×

              </button>

            </div>



            <p className="mt-6 font-semibold">{selectedStartup.tagline}</p>

            <p className="mt-3 leading-7 text-slate-600">

              {selectedStartup.description}

            </p>



            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-500">

                  Funding requested

                </p>

                <p className="mt-2 text-xl font-black">

                  {formatFunding(selectedStartup.funding)}

                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-500">

                  Location

                </p>

                <p className="mt-2 font-bold">{selectedStartup.location}</p>

              </div>

            </div>



            {selectedStartup.website && (

              <a

                href={selectedStartup.website}

                target="_blank"

                rel="noreferrer"

                className="mt-5 inline-block font-bold text-indigo-600 hover:underline"

              >

                Visit website ↗

              </a>

            )}



            <div className="mt-6 flex flex-wrap gap-3">

              <button

                type="button"

                onClick={() => toggleSaved(selectedStartup.id)}

                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-bold hover:bg-slate-50"

              >

                {savedIds.includes(selectedStartup.id)

                  ? '♥ Remove from shortlist'

                  : '♡ Add to shortlist'}

              </button>

              <button

                type="button"

                onClick={() => setSelectedStartup(null)}

                className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"

              >

                Done

              </button>

            </div>

          </section>

        </div>

      )}



      {/* Authentication modal */}
      {authMode && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !authLoading) setAuthMode(null)
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">StartupFund</p>
                <h2 id="auth-modal-title" className="mt-2 text-2xl font-black">
                  {authMode === 'register' ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {authMode === 'register' ? 'Join founders and investors building what comes next.' : 'Log in to continue to StartupFund.'}
                </p>
              </div>
              <button type="button" onClick={() => setAuthMode(null)} disabled={authLoading} aria-label="Close authentication" className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {authMode === 'register' && (
                <>
                  <label className="block text-sm font-semibold text-slate-700">
                    Full name
                    <input required minLength={2} maxLength={80} autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    I am joining as
                    <select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
                      <option value="founder">Founder</option>
                      <option value="investor">Investor</option>
                    </select>
                  </label>
                </>
              )}
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <input required type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input required type="password" minLength={6} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 6 characters" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
              </label>

              {authError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{authError}</p>}
              {authSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{authSuccess}</p>}

              <button type="submit" disabled={authLoading} className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Log in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              {authMode === 'register' ? 'Already have an account?' : 'New to StartupFund?'}{' '}
              <button type="button" disabled={authLoading} onClick={() => openAuth(authMode === 'register' ? 'login' : 'register')} className="font-bold text-indigo-600 hover:underline">
                {authMode === 'register' ? 'Log in' : 'Create an account'}
              </button>
            </p>
          </section>
        </div>
      )}

      {/* Notification */}

      {notice && (

        <div

          role="status"

          className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-medium leading-6 text-white shadow-2xl"

        >

          {notice}

        </div>

      )}

    </div>

  )

}



export default App

