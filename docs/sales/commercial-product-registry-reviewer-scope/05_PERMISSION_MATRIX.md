# Permission Matrix

| Operation | Required Identity capability | Assignment required |
| --- | --- | --- |
| Queue/packet/history scoped read | `commercial_product.read` | Yes, unless `commercial_product.review.read_all` is present and active |
| Full review read | `commercial_product.read` and `commercial_product.review.read_all` | No |
| Gate decision write | Gate-specific `commercial_product.review_*` capability | Yes, same candidate and gate |
| Source resolution write | `commercial_product.review_source_authority` | Yes, same candidate and `SOURCE_AUTHORITY` |
| Create assignment | `commercial_product.review_assignment.manage` | No; provisioner cannot self-assign |
| Revoke assignment | `commercial_product.review_assignment.manage` | No; assignment org must match active org |

`sales.admin` is not assignment authority. `commercial_product.edit` is not review authority. A gate capability without assignment fails closed. Assignment without the required Identity capability also fails closed.

