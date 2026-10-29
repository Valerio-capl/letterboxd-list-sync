// link del film boxd.it/lid  lid in data-resolvable-poster-path

class Sync {
  // films in the source that are not in the receiver;
  // both lists are Map<boxd_id, [title, year, url]>
  compare(sourceList, receiverList) {
    const missing = [];
    let position = 0;
    for (const [id, [title, year, url]] of sourceList) {
      position++;
      if (!receiverList.has(id)) {
        missing.push({ position, title, year, url });
      }
    }
    return missing;
  }
}
