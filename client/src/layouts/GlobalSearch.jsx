import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import searchApi from '../api/search.api';
import { SEARCH_TYPE_ORDER, searchTypeMeta } from '../components/search/resultMeta';

const MIN_QUERY = 2;
const PER_TYPE = 5;

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const requestId = useRef(0);

  const query = term.trim();

  useEffect(() => {
    if (query.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const id = requestId.current + 1;
      requestId.current = id;
      try {
        const { data } = await searchApi.query({ q: query, limit: PER_TYPE });
        if (!cancelled && id === requestId.current) setResults(data.results || []);
      } catch {
        if (!cancelled && id === requestId.current) setResults([]);
      } finally {
        if (!cancelled && id === requestId.current) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  // Group results by type in a stable, curated order.
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

  const flat = useMemo(() => groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.meta }))), [groups]);

  useEffect(() => {
    const onClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goTo = (item) => {
    setOpen(false);
    setTerm('');
    setResults([]);
    navigate(item.url);
  };

  const submitAll = () => {
    if (query.length < MIN_QUERY) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (flat.length ? (index + 1) % flat.length : -1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (flat.length ? (index - 1 + flat.length) % flat.length : -1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && flat[activeIndex]) goTo(flat[activeIndex]);
      else submitAll();
    }
  };

  const showPanel = open && query.length >= MIN_QUERY;

  return (
    <div className="global-search" ref={rootRef}>
      <div className="global-search__field">
        <Search size={16} className="global-search__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="global-search__input"
          placeholder="Search employees, documents, jobs…"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Global search"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 size={15} className="global-search__spinner" aria-hidden="true" />
        ) : (
          term && (
            <button
              type="button"
              className="global-search__clear"
              onClick={() => {
                setTerm('');
                setResults([]);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )
        )}
      </div>

      {showPanel && (
        <div className="global-search__panel" role="listbox">
          {flat.length === 0 && !loading && (
            <div className="global-search__empty">No matches found for “{query}”</div>
          )}

          {groups.map((group) => {
            const Icon = group.meta.icon;
            return (
              <div className="global-search__group" key={group.type}>
                <div className="global-search__group-title">
                  <Icon size={13} aria-hidden="true" />
                  <span>{group.meta.label}</span>
                </div>
                <ul className="global-search__list">
                  {group.items.map((item) => {
                    const index = flat.findIndex(
                      (entry) => entry.type === item.type && entry.id === item.id
                    );
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className={`global-search__item${
                            index === activeIndex ? ' is-active' : ''
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goTo(item)}
                        >
                          <span className={`global-search__badge tone-${group.meta.tone}`}>
                            {group.meta.singular}
                          </span>
                          <span className="global-search__text">
                            <span className="global-search__name">{item.name}</span>
                            {item.description && (
                              <span className="global-search__desc">{item.description}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {flat.length > 0 && (
            <button type="button" className="global-search__all" onClick={submitAll}>
              View all results for “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}