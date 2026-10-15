import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, Search as SearchIcon, SearchX } from 'lucide-react';
import searchApi from '../../api/search.api';
import { SEARCH_TYPE_ORDER, searchTypeMeta } from '../../components/search/resultMeta';

const PER_TYPE = 20;

export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = (params.get('q') || '').trim();

  const [term, setTerm] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    setTerm(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (!urlQuery) {
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    const id = requestId.current + 1;
    requestId.current = id;

    searchApi
      .query({ q: urlQuery, limit: PER_TYPE })
      .then(({ data }) => {
        if (!cancelled && id === requestId.current) setResults(data.results || []);
      })
      .catch(() => {
        if (!cancelled && id === requestId.current) {
          setResults([]);
          setError('Could not run the search. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled && id === requestId.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlQuery]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of results) {
      if (!map.has(item.type)) map.set(item.type, []);
      map.get(item.type).push(item);
    }
    return SEARCH_TYPE_ORDER.filter((type) => map.has(type)).map((type) => ({
      type,
      meta: searchTypeMeta(type),
      items: map.get(type),
    }));
  }, [results]);

  const submit = (event) => {
    event.preventDefault();
    const next = term.trim();
    if (next === urlQuery) return;
    if (!next) {
      setParams({}, { replace: true });
      return;
    }
    setParams({ q: next }, { replace: true });
  };

  return (
    <div className="hub stack-lg search-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <SearchIcon size={18} />
        </span>
        <div>
          <h1>Search</h1>
          <p>Find employees, departments, documents, attendance, leaves, payroll, jobs and candidates</p>
        </div>
      </header>

      <form className="search-page__form" onSubmit={submit} role="search">
        <div className="search-page__field">
          <SearchIcon size={17} className="search-page__icon" aria-hidden="true" />
          <input
            type="search"
            className="search-page__input"
            placeholder="Search across your workspace…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            aria-label="Search"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary btn-sm search-page__submit">
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {error}
        </div>
      )}

      {!urlQuery ? (
        <div className="panel search-page__empty">
          <SearchX size={34} aria-hidden="true" />
          <p>Type a keyword above to search across the workspace.</p>
        </div>
      ) : loading ? (
        <div className="panel search-page__loading">
          <Loader2 size={22} className="spin" aria-hidden="true" />
          <span>Searching for “{urlQuery}”…</span>
        </div>
      ) : results.length === 0 ? (
        <div className="panel search-page__empty">
          <SearchX size={34} aria-hidden="true" />
          <p>No results found for “{urlQuery}”.</p>
        </div>
      ) : (
        <>
          <p className="search-page__summary">
            <strong>{results.length}</strong> result{results.length === 1 ? '' : 's'} for “
            {urlQuery}”
          </p>
          {groups.map((group) => {
            const Icon = group.meta.icon;
            return (
              <section className="panel search-group" key={group.type}>
                <div className="panel__header search-group__head">
                  <h3>
                    <span className={`search-group__icon tone-${group.meta.tone}`}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    {group.meta.label}
                  </h3>
                  <span className="search-group__count">{group.items.length}</span>
                </div>
                <ul className="search-group__list">
                  {group.items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link className="search-result" to={item.url}>
                        <span className="search-result__body">
                          <span className="search-result__name">{item.name}</span>
                          {item.description && (
                            <span className="search-result__desc">{item.description}</span>
                          )}
                        </span>
                        <span className="search-result__go">
                          <ArrowRight size={16} aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}