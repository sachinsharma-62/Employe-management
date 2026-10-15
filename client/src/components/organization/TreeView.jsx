import { useState } from 'react';
import {
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';

const NODE_ICONS = {
  company: Building2,
  department: Briefcase,
  team: Users,
  manager: UserCog,
  employee: UserRound,
};

export default function TreeView({ tree = [] }) {
  if (!tree.length) return null;
  return (
    <div className="org-tree">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

function TreeNode({ node, depth }) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = NODE_ICONS[node.type] || Building2;
  const hasChildren = (node.children?.length || 0) > 0;

  return (
    <div className="org-tree__node">
      <div className={`org-tree__row org-tree__row--${node.type}`} style={{ paddingLeft: depth * 22 }}>
        <button
          type="button"
          className="org-tree__toggle"
          onClick={() => setOpen((o) => !o)}
          disabled={!hasChildren}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="org-tree__leaf" />
          )}
        </button>
        <span className={`org-tree__icon org-tree__icon--${node.type}`}>
          <Icon size={15} />
        </span>
        <div className="org-tree__body">
          <strong>{node.label}</strong>
          {node.subtitle && <small>{node.subtitle}</small>}
        </div>
        {node.count > 0 && <span className="org-tree__count">{node.count}</span>}
      </div>

      {open && hasChildren && (
        <div className="org-tree__children">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}